<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    /**
     * Danh sách banner công khai trên trang chủ (GET /api/banners)
     */
    public function index()
    {
        $banners = Banner::where('is_active', true)
            ->orderBy('order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $banners,
        ]);
    }

    /**
     * Quản lý banner dành cho Admin (GET /api/admin/banners)
     */
    public function adminIndex()
    {
        $banners = Banner::orderBy('order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $banners,
        ]);
    }

    /**
     * Tạo banner mới (POST /api/admin/banners)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'image_url'   => 'required|string',
            'link_url'    => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'order'       => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);

        $banner = Banner::create([
            'title'       => $validated['title'],
            'image_url'   => $validated['image_url'],
            'link_url'    => $validated['link_url'] ?? null,
            'description' => $validated['description'] ?? null,
            'order'       => $validated['order'] ?? 0,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tạo banner thành công.',
            'data'    => $banner,
        ], 201);
    }

    /**
     * Cập nhật banner (PUT /api/admin/banners/{id})
     */
    public function update(Request $request, string $id)
    {
        $banner = Banner::findOrFail($id);

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'image_url'   => 'sometimes|required|string',
            'link_url'    => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'order'       => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);

        $banner->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật banner thành công.',
            'data'    => $banner,
        ]);
    }

    /**
     * Xóa banner (DELETE /api/admin/banners/{id})
     */
    public function destroy(string $id)
    {
        $banner = Banner::findOrFail($id);
        $banner->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa banner thành công.',
        ]);
    }
}
