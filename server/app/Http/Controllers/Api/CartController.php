<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Lấy hoặc tạo giỏ hàng của user
     */
    protected function getOrCreateCart(Request $request): Cart
    {
        return Cart::firstOrCreate(['user_id' => $request->user()->id]);
    }

    /**
     * 1. XEM GIỎ HÀNG (GET /api/cart)
     */
    public function index(Request $request)
    {
        $cart = $this->getOrCreateCart($request);

        $cart->load([
            'items.product.images',
            'items.variant',
        ]);

        // Tính tổng tiền giỏ hàng
        $subtotal = 0;
        $totalQuantity = 0;

        foreach ($cart->items as $item) {
            $price = $item->variant ? $item->variant->price : ($item->product->discount_price ?? $item->product->price);
            $subtotal += $price * $item->quantity;
            $totalQuantity += $item->quantity;
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'cart_id'        => $cart->id,
                'items'          => $cart->items,
                'total_quantity' => $totalQuantity,
                'subtotal'       => (float) $subtotal,
            ],
        ]);
    }

    /**
     * 2. THÊM SẢN PHẨM VÀO GIỎ (POST /api/cart/items)
     */
    public function addItem(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity'   => 'nullable|integer|min:1',
        ]);

        $quantity = $validated['quantity'] ?? 1;
        $product = Product::findOrFail($validated['product_id']);

        if (!$product->is_active) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Sản phẩm này hiện đang ngừng bán.',
            ], 422);
        }

        // Kiểm tra biến thể nếu có
        if (!empty($validated['variant_id'])) {
            $variant = ProductVariant::where('id', $validated['variant_id'])
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->first();

            if (!$variant) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Biến thể sản phẩm không hợp lệ.',
                ], 422);
            }
        }

        $cart = $this->getOrCreateCart($request);

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $validated['product_id'])
            ->where('variant_id', $validated['variant_id'] ?? null)
            ->first();

        if ($cartItem) {
            $cartItem->increment('quantity', $quantity);
        } else {
            $cartItem = CartItem::create([
                'cart_id'    => $cart->id,
                'product_id' => $validated['product_id'],
                'variant_id' => $validated['variant_id'] ?? null,
                'quantity'   => $quantity,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã thêm sản phẩm vào giỏ hàng.',
            'data'    => $cartItem->load(['product.images', 'variant']),
        ], 201);
    }

    /**
     * 3. CẬP NHẬT SỐ LƯỢNG MÓN (PUT /api/cart/items/{id})
     */
    public function updateItem(Request $request, string $id)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $this->getOrCreateCart($request);

        $cartItem = CartItem::where('cart_id', $cart->id)->where('id', $id)->first();

        if (!$cartItem) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Mục trong giỏ hàng không tồn tại.',
            ], 404);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật số lượng thành công.',
            'data'    => $cartItem,
        ]);
    }

    /**
     * 4. XÓA MÓN KHỎI GIỎ (DELETE /api/cart/items/{id})
     */
    public function removeItem(Request $request, string $id)
    {
        $cart = $this->getOrCreateCart($request);

        $cartItem = CartItem::where('cart_id', $cart->id)->where('id', $id)->first();

        if (!$cartItem) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Mục trong giỏ hàng không tồn tại.',
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã xóa món khỏi giỏ hàng.',
        ]);
    }

    /**
     * 5. XÓA SẠCH GIỎ HÀNG (DELETE /api/cart)
     */
    public function clear(Request $request)
    {
        $cart = $this->getOrCreateCart($request);
        $cart->items()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã làm trống giỏ hàng.',
        ]);
    }
}
