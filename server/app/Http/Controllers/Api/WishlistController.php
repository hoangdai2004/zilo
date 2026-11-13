<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * 1. DANH SÁCH SẢN PHẨM YÊU THÍCH (GET /api/wishlist)
     */
    public function index(Request $request)
    {
        $wishlists = Wishlist::where('user_id', $request->user()->id)
            ->with(['product' => function ($q) {
                $q->with(['brand', 'category', 'images']);
            }])
            ->latest()
            ->paginate(12);

        return response()->json([
            'status' => 'success',
            'data'   => $wishlists,
        ]);
    }

    /**
     * 2. BẬT / TẮT YÊU THÍCH SẢN PHẨM (POST /api/wishlist/toggle)
     */
    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $userId = $request->user()->id;
        $productId = $validated['product_id'];

        $wishlist = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($wishlist) {
            $wishlist->delete();
            return response()->json([
                'status'  => 'success',
                'action'  => 'removed',
                'message' => 'Đã bỏ yêu thích sản phẩm.',
            ]);
        }

        Wishlist::create([
            'user_id'    => $userId,
            'product_id' => $productId,
        ]);

        return response()->json([
            'status'  => 'success',
            'action'  => 'added',
            'message' => 'Đã thêm vào danh sách yêu thích.',
        ], 201);
    }

    /**
     * 3. XÓA KHỎI DANH SÁCH YÊU THÍCH (DELETE /api/wishlist/{productId})
     */
    public function destroy(Request $request, string $productId)
    {
        $deleted = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Sản phẩm không có trong danh sách yêu thích.',
            ], 404);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã xóa khỏi danh sách yêu thích.',
        ]);
    }
}

