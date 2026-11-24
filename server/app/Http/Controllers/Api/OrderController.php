<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function adminIndex(Request $request)
    {
        $query = Order::with(['user:id,name,email', 'items.product.images', 'items.variant', 'latestPayment'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($orders) use ($search) {
                $orders->where('order_number', 'like', "%{$search}%")
                    ->orWhere('shipping_name', 'like', "%{$search}%")
                    ->orWhere('shipping_phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(20),
        ]);
    }

    public function adminUpdateStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:processing,shipped,delivered,cancelled',
        ]);

        $order = DB::transaction(function () use ($id, $validated) {
            $order = Order::with('items')
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                return null;
            }

            $allowedTransitions = [
                'pending' => ['processing', 'cancelled'],
                'processing' => ['shipped', 'cancelled'],
                'shipped' => ['delivered'],
                'delivered' => [],
                'cancelled' => [],
            ];
            $nextStatus = $validated['status'];

            if (!in_array($nextStatus, $allowedTransitions[$order->status] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => ['Không thể chuyển đơn hàng từ trạng thái hiện tại sang trạng thái đã chọn.'],
                ]);
            }

            if ($nextStatus === 'cancelled') {
                foreach ($order->items as $item) {
                    if ($item->variant_id) {
                        ProductVariant::whereKey($item->variant_id)->increment('stock', $item->quantity);
                    } else {
                        Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                    }
                }
            }

            $order->update(['status' => $nextStatus]);

            return $order->load(['user:id,name,email', 'items.product.images', 'items.variant', 'latestPayment']);
        });

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Đơn hàng không tồn tại.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $order,
        ]);
    }

    /**
     * 1. DANH SÁCH ĐƠN HÀNG CỦA USER (GET /api/orders)
     */
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items.product.images', 'items.variant', 'latestPayment'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data'   => $orders,
        ]);
    }

    /**
     * 2. CHI TIẾT ĐƠN HÀNG (GET /api/orders/{id})
     */
    public function show(Request $request, string $id)
    {
        $order = Order::with(['items.product.images', 'items.variant', 'payments', 'coupon'])
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Đơn hàng không tồn tại.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $order,
        ]);
    }

    /**
     * 3. TẠO ĐƠN HÀNG / THANH TOÁN (POST /api/orders/checkout)
     */
    public function checkout(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'shipping_name' => 'required|string|max:255',
            'shipping_phone' => 'required|string|max:20',
            'shipping_address' => 'required|string',
            'payment_method' => 'required|in:cod,vnpay,momo',
            'coupon_code' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $shippingName = $validated['shipping_name'];
        $shippingPhone = $validated['shipping_phone'];
        $shippingAddress = $validated['shipping_address'];
        $paymentMethod = $validated['payment_method'];
        $couponCode = $validated['coupon_code'] ?? null;
        $notes = $validated['notes'] ?? null;

        // Lấy giỏ hàng từ DB hoặc từ request items
        $requestItems = $validated['items'] ?? null;
        $cart = null;

        if (empty($requestItems)) {
            $cart = Cart::with(['items.product', 'items.variant'])->where('user_id', $user->id)->first();
            if (!$cart || $cart->items->isEmpty()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Giỏ hàng của bạn đang trống, không thể đặt hàng.',
                ], 422);
            }
        }

        return DB::transaction(function () use ($user, $cart, $requestItems, $shippingName, $shippingPhone, $shippingAddress, $paymentMethod, $couponCode, $notes) {
            $subtotal = 0;
            $orderItemsData = [];

            if (!empty($requestItems)) {
                foreach ($requestItems as $reqItem) {
                    $productId = $reqItem['productId'] ?? $reqItem['product_id'] ?? null;
                    $variantId = $reqItem['variantId'] ?? $reqItem['variant_id'] ?? null;
                    $qty = (int) ($reqItem['quantity'] ?? 1);

                    $product = Product::whereKey($productId)
                        ->where('is_active', true)
                        ->lockForUpdate()
                        ->first();
                    if (!$product) {
                        throw ValidationException::withMessages([
                            'items' => ['Một sản phẩm đã ngừng kinh doanh hoặc không còn tồn tại.'],
                        ]);
                    }

                    $variant = $variantId
                        ? ProductVariant::whereKey($variantId)
                            ->where('product_id', $product->id)
                            ->where('is_active', true)
                            ->lockForUpdate()
                            ->first()
                        : null;
                    if ($variantId && !$variant) {
                        throw ValidationException::withMessages([
                            'items' => ['Biến thể không hợp lệ cho sản phẩm đã chọn.'],
                        ]);
                    }
                    $stock = $variant ? $variant->stock : $product->stock;
                    if ($qty > $stock) {
                        throw ValidationException::withMessages([
                            'items' => ["Sản phẩm '{$product->name}' chỉ còn {$stock} sản phẩm trong kho."],
                        ]);
                    }
                    $unitPrice = $variant ? $variant->price : ($product->discount_price ?? $product->price);
                    $itemSubtotal = $unitPrice * $qty;
                    $subtotal += $itemSubtotal;

                    $variant ? $variant->decrement('stock', $qty) : $product->decrement('stock', $qty);

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'variant_id' => $variant?->id,
                        'quantity'   => $qty,
                        'unit_price' => $unitPrice,
                        'subtotal'   => $itemSubtotal,
                    ];
                }
            } else {
                foreach ($cart->items as $item) {
                    $product = $item->product;
                    $variant = $item->variant;

                    if (!$product->is_active) {
                        throw ValidationException::withMessages([
                            'items' => ["Sản phẩm '{$product->name}' hiện đã ngừng kinh doanh."],
                        ]);
                    }

                    $stock = $variant ? $variant->stock : $product->stock;
                    if ($item->quantity > $stock) {
                        throw ValidationException::withMessages([
                            'items' => ["Sản phẩm '{$product->name}' chỉ còn {$stock} sản phẩm trong kho."],
                        ]);
                    }
                    $unitPrice = $variant ? $variant->price : ($product->discount_price ?? $product->price);
                    $itemSubtotal = $unitPrice * $item->quantity;
                    $subtotal += $itemSubtotal;

                    $variant ? $variant->decrement('stock', $item->quantity) : $product->decrement('stock', $item->quantity);

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'variant_id' => $variant?->id,
                        'quantity'   => $item->quantity,
                        'unit_price' => $unitPrice,
                        'subtotal'   => $itemSubtotal,
                    ];
                }
            }

            // Xử lý mã giảm giá
            $discountAmount = 0;
            $couponId = null;

            if (!empty($couponCode)) {
                $coupon = Coupon::withCount('orders')
                    ->where('code', strtoupper($couponCode))
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->first();
                if (!$coupon || ($coupon->max_uses !== null && $coupon->orders_count >= $coupon->max_uses)) {
                    throw ValidationException::withMessages(['coupon_code' => ['Mã giảm giá không tồn tại hoặc đã hết hiệu lực.']]);
                }
                if ($subtotal < $coupon->min_order_value) {
                    throw ValidationException::withMessages(['coupon_code' => ['Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này.']]);
                }
                $couponId = $coupon->id;
                if ($coupon->discount_type === 'percentage') {
                    $discountAmount = ($subtotal * $coupon->discount_value) / 100;
                } else {
                    $discountAmount = min($coupon->discount_value, $subtotal);
                }
            }

            $shippingFee = $subtotal >= 500000 ? 0 : 30000;
            $totalAmount = max(0, $subtotal - $discountAmount + $shippingFee);

            $orderNumber = 'ZILO-' . strtoupper(Str::random(8));

            $order = Order::create([
                'user_id'          => $user->id,
                'coupon_id'        => $couponId,
                'order_number'     => $orderNumber,
                'subtotal'         => $subtotal,
                'discount_amount'  => $discountAmount,
                'shipping_fee'     => $shippingFee,
                'total_amount'     => $totalAmount,
                'status'           => 'pending',
                'payment_status'   => 'pending',
                'shipping_name'    => $shippingName,
                'shipping_phone'   => $shippingPhone,
                'shipping_address' => $shippingAddress,
                'notes'            => $notes,
            ]);

            foreach ($orderItemsData as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }

            Payment::create([
                'order_id'       => $order->id,
                'payment_method' => $paymentMethod,
                'amount'         => $totalAmount,
                'status'         => 'pending',
            ]);

            if ($cart) {
                $cart->items()->delete();
            } elseif (!empty($requestItems)) {
                $userCart = Cart::where('user_id', $user->id)->first();
                if ($userCart) {
                    foreach ($requestItems as $reqItem) {
                        $cartItemQuery = $userCart->items()
                            ->where('product_id', $reqItem['product_id']);
                        if (!empty($reqItem['variant_id'])) {
                            $cartItemQuery->where('variant_id', $reqItem['variant_id']);
                        } else {
                            $cartItemQuery->whereNull('variant_id');
                        }
                        $cartItemQuery->delete();
                    }
                }
            }

            $paymentUrl = null;
            if ($paymentMethod === 'vnpay') {
                try {
                    $paymentUrl = app(\App\Services\VNPayService::class)->createPaymentUrl($order, request()->ip());
                } catch (\Throwable $e) {
                    \Log::error('VNPay URL error: ' . $e->getMessage());
                }
            }

            return response()->json([
                'status'      => 'success',
                'message'     => 'Đặt hàng thành công.',
                'id'          => $order->order_number, // Khớp với CheckoutPage FE: setOrderSuccess(order.id)
                'payment_url' => $paymentUrl,
                'data'        => $order->load(['items.product', 'items.variant', 'payments']),
            ], 201);
        });
    }

    /**
     * 4. HỦY ĐƠN HÀNG (POST /api/orders/{id}/cancel)
     */
    public function cancel(Request $request, string $id)
    {
        $order = Order::with('items')->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Đơn hàng không tồn tại.',
            ], 404);
        }

        if ($order->status !== 'pending') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xử lý (pending).',
            ], 422);
        }

        DB::transaction(function () use ($order) {
            // Hoàn lại số lượng tồn kho
            foreach ($order->items as $item) {
                if ($item->variant_id) {
                    ProductVariant::where('id', $item->variant_id)->increment('stock', $item->quantity);
                } else {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }

            $order->update(['status' => 'cancelled']);
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Hủy đơn hàng thành công.',
        ]);
    }
}
