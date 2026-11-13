<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * 1. DANH SÁCH DANH MỤC (GET /api/categories)
     */
    public function index()
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->withCount(['products' => fn ($products) => $products->where('is_active', true)])
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $categories,
        ]);
    }

    public function adminIndex()
    {
        $categories = Category::with('children')
            ->withCount('products')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $categories,
        ]);
    }

    /**
     * 2. CHI TIẾT DANH MỤC KÈM SẢN PHẨM (GET /api/categories/{id})
     */
    public function show(string $id)
    {
        $category = Category::with(['children', 'products' => function ($q) {
            $q->where('is_active', true)->with(['brand', 'images'])->latest();
        }])
        ->where('is_active', true)
        ->where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('slug', $id);
        })
        ->first();

        if (!$category) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Danh mục không tồn tại.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $category,
        ]);
    }

    /**
     * 3. THÊM MỚI DANH MỤC (POST /api/categories)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id'   => 'nullable|exists:categories,id',
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|unique:categories,slug',
            'image'       => 'nullable|string',
            'description' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category = Category::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tạo danh mục thành công.',
            'data'    => $category,
        ], 201);
    }

    /**
     * 4. CẬP NHẬT DANH MỤC (PUT /api/categories/{id})
     */
    public function update(Request $request, string $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Danh mục không tồn tại.',
            ], 404);
        }

        $validated = $request->validate([
            'parent_id'   => 'nullable|exists:categories,id',
            'name'        => 'sometimes|required|string|max:255',
            'slug'        => 'sometimes|nullable|string|unique:categories,slug,' . $category->id,
            'image'       => 'nullable|string',
            'description' => 'nullable|string',
            'is_active'   => 'sometimes|boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật danh mục thành công.',
            'data'    => $category,
        ]);
    }

    /**
     * 5. XÓA DANH MỤC (DELETE /api/categories/{id})
     */
    public function destroy(string $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Danh mục không tồn tại.',
            ], 404);
        }

        $category->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa danh mục thành công.',
        ]);
    }
}
