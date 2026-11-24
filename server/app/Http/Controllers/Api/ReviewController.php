<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    /**
     * 1. DANH SÁCH ĐÁNH GIÁ CỦA SẢN PHẨM (GET /api/products/{productId}/reviews)
     */
    public function index(string $productId)
    {
        $reviews = Review::where('product_id', $productId)
            ->where('is_approved', true)
            ->with('user:id,name')
            ->latest()
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data'   => $reviews,
        ]);
    }

    /**
     * 2. GỬI ĐÁNH GIÁ MỚI (POST /api/products/{productId}/reviews)
     */
    public function store(Request $request, string $productId)
    {
        $product = Product::findOrFail($productId);
        $user = $request->user();

        $validated = $request->validate([
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'nullable|string|max:1000',
            'order_item_id' => 'nullable|exists:order_items,id',
            'images'        => 'nullable|array',
            'images.*'      => 'string',
        ]);

        $review = DB::transaction(function () use ($validated, $product, $user) {
            // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
            $existingReview = Review::where('product_id', $product->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existingReview) {
                throw ValidationException::withMessages([
                    'comment' => ['Bạn đã gửi đánh giá cho sản phẩm này rồi.'],
                ]);
            }

            // Tìm đơn hàng đã giao (delivered) để xác thực người mua hàng thật
            $orderItem = OrderItem::where('product_id', $product->id)
                ->whereHas('order', fn ($orders) => $orders
                    ->where('user_id', $user->id)
                    ->where('status', 'delivered'))
                ->first();

            return Review::create([
                'user_id'       => $user->id,
                'product_id'    => $product->id,
                'order_item_id' => $orderItem?->id,
                'rating'        => $validated['rating'],
                'comment'       => $validated['comment'] ?? null,
                'images'        => $validated['images'] ?? null,
                'is_approved'   => true,
            ]);
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Gửi đánh giá thành công.',
            'data'    => $review->load('user:id,name'),
        ], 201);
    }

    /**
     * 3. XÓA ĐÁNH GIÁ (DELETE /api/reviews/{id})
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();

        $review = Review::where('id', $id)
            ->where(function ($q) use ($user) {
                // Người dùng có thể xóa đánh giá của chính mình, hoặc admin
                if ($user->role !== 'admin') {
                    $q->where('user_id', $user->id);
                }
            })
            ->first();

        if (!$review) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Đánh giá không tồn tại hoặc bạn không có quyền xóa.',
            ], 404);
        }

        $review->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa đánh giá thành công.',
        ]);
    }
}
