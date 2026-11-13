<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    /**
     * 1. DANH SÁCH THƯƠNG HIỆU (GET /api/brands)
     */
    public function index()
    {
        $brands = Brand::where('is_active', true)
            ->withCount(['products' => fn ($products) => $products->where('is_active', true)])
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $brands,
        ]);
    }

    public function adminIndex()
    {
        return response()->json([
            'status' => 'success',
            'data' => Brand::withCount('products')->orderBy('name')->get(),
        ]);
    }

    /**
     * 2. CHI TIẾT THƯƠNG HIỆU KÈM SẢN PHẨM (GET /api/brands/{id})
     */
    public function show(string $id)
    {
        $brand = Brand::with(['products' => function ($q) {
            $q->where('is_active', true)->with(['category', 'images'])->latest();
        }])
        ->where('is_active', true)
        ->where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('slug', $id);
        })
        ->first();

        if (!$brand) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Thương hiệu không tồn tại.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $brand,
        ]);
    }

    /**
     * 3. THÊM THƯƠNG HIỆU (POST /api/brands)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|unique:brands,slug',
            'logo'        => 'nullable|string',
            'description' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $brand = Brand::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tạo thương hiệu thành công.',
            'data'    => $brand,
        ], 201);
    }

    /**
     * 4. CẬP NHẬT THƯƠNG HIỆU (PUT /api/brands/{id})
     */
    public function update(Request $request, string $id)
    {
        $brand = Brand::find($id);

        if (!$brand) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Thương hiệu không tồn tại.',
            ], 404);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'slug'        => 'sometimes|nullable|string|unique:brands,slug,' . $brand->id,
            'logo'        => 'nullable|string',
            'description' => 'nullable|string',
            'is_active'   => 'sometimes|boolean',
        ]);

        $brand->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật thương hiệu thành công.',
            'data'    => $brand,
        ]);
    }

    /**
     * 5. XÓA THƯƠNG HIỆU (DELETE /api/brands/{id})
     */
    public function destroy(string $id)
    {
        $brand = Brand::find($id);

        if (!$brand) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Thương hiệu không tồn tại.',
            ], 404);
        }

        $brand->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa thương hiệu thành công.',
        ]);
    }
}
