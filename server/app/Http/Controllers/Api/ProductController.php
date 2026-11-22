<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * 1. LẤY DANH SÁCH SẢN PHẨM (GET /api/products)
     * Hỗ trợ tìm kiếm, lọc theo danh mục, thương hiệu, khoảng giá và sắp xếp.
     */
    public function index(Request $request)
    {
        return $this->listProducts($request, false);
    }

    /**
     * Product listing for the admin product manager, including hidden products.
     */
    public function adminIndex(Request $request)
    {
        return $this->listProducts($request, true);
    }

    private function listProducts(Request $request, bool $includeInactive)
    {
        $query = Product::with([
            'brand:id,name,slug',
            'category:id,name,slug',
            'images',
            'variants' => fn ($variants) => $variants->where('is_active', true),
        ])
            ->withAvg(['reviews as average_rating' => fn ($reviews) => $reviews->where('is_approved', true)], 'rating')
            ->withCount(['reviews as review_count' => fn ($reviews) => $reviews->where('is_approved', true)]);

        if (!$includeInactive) {
            $query->where('is_active', true);
        }

        // Lọc theo từ khóa tìm kiếm (tên hoặc mô tả)
        $search = $request->input('search') ?? $request->input('keyword');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Lọc theo danh mục
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Lọc theo thương hiệu
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        // Lọc theo khoảng giá
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Sắp xếp (mặc định sản phẩm mới nhất)
        switch ($request->query('sort')) {
            case 'price_asc':
            case 'price-asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
            case 'price-desc':
                $query->orderBy('price', 'desc');
                break;
            case 'rating':
                $query->orderByDesc('average_rating');
                break;
            case 'name_asc':
            case 'name-asc':
                $query->orderBy('name', 'asc');
                break;
            default:
                $query->latest();
                break;
        }

        $perPage = $request->integer('per_page', 12);
        $products = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data'   => $products,
        ]);
    }

    /**
     * 2. XEM CHI TIẾT 1 SẢN PHẨM (GET /api/products/{id})
     * Tìm theo ID hoặc theo slug thân thiện URL.
     */
    public function show(string $id)
    {
        $product = Product::with([
            'brand',
            'category',
            'images',
            'variants' => fn ($variants) => $variants->where('is_active', true),
            'reviews' => function ($q) {
                $q->where('is_approved', true)->with('user:id,name');
            },
        ])
        ->withAvg(['reviews as average_rating' => fn ($q) => $q->where('is_approved', true)], 'rating')
        ->withCount(['reviews as review_count' => fn ($q) => $q->where('is_approved', true)])
        ->where('is_active', true)
        ->where(function ($query) use ($id) {
            $query->where('id', $id)->orWhere('slug', $id);
        })
        ->first();

        if (!$product) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $product,
        ]);
    }

    /**
     * 3. THÊM SẢN PHẨM MỚI (POST /api/products)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        $defaultBrandId = \App\Models\Brand::first()?->id ?? 1;
        $defaultCatId = \App\Models\Category::first()?->id ?? 1;

        $categoryId = $request->input('category_id') ?? $request->input('categoryId') ?? $defaultCatId;
        $brandId = $request->input('brand_id') ?? $request->input('brandId') ?? $defaultBrandId;
        $name = $request->input('name');
        $slug = $request->input('slug') ?: Str::slug($name) . '-' . Str::random(5);
        $price = $request->input('price');
        $discountPrice = $request->input('discount_price') ?? $request->input('discountPrice');
        $stock = $request->input('stock', 0);
        $description = $request->input('description');

        $isActive = true;
        if ($request->has('is_active')) {
            $isActive = $request->boolean('is_active');
        } elseif ($request->has('status')) {
            $isActive = $request->input('status') === 'active';
        }

        $product = Product::create([
            'category_id'    => $categoryId,
            'brand_id'       => $brandId,
            'name'           => $name,
            'slug'           => $slug,
            'price'          => $price,
            'discount_price' => $discountPrice,
            'stock'          => $stock,
            'description'    => $description,
            'is_active'      => $isActive,
        ]);

        // Lưu ảnh sản phẩm nếu có
        $images = (array) $request->input('images', []);
        $thumbnail = $request->input('thumbnail');
        if ($thumbnail && !in_array($thumbnail, $images)) {
            array_unshift($images, $thumbnail);
        }

        foreach ($images as $index => $imgUrl) {
            if (!empty($imgUrl) && is_string($imgUrl)) {
                \App\Models\ProductImage::create([
                    'product_id' => $product->id,
                    'image_url'  => $imgUrl,
                    'is_primary' => $index === 0,
                    'sort_order' => $index,
                ]);
            }
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Tạo sản phẩm thành công.',
            'data'    => $product->load(['brand', 'category', 'images']),
        ], 201);
    }

    /**
     * 4. CẬP NHẬT SẢN PHẨM (PUT/PATCH /api/products/{id})
     */
    public function update(Request $request, string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Sản phẩm không tồn tại.',
            ], 404);
        }

        $updateData = [];

        if ($request->filled('name')) $updateData['name'] = $request->name;
        if ($request->filled('price')) $updateData['price'] = $request->price;
        if ($request->has('discount_price') || $request->has('discountPrice')) {
            $updateData['discount_price'] = $request->input('discount_price') ?? $request->input('discountPrice');
        }
        if ($request->has('stock')) $updateData['stock'] = $request->stock;
        if ($request->has('description')) $updateData['description'] = $request->description;
        if ($request->filled('category_id') || $request->filled('categoryId')) {
            $updateData['category_id'] = $request->input('category_id') ?? $request->input('categoryId');
        }
        if ($request->filled('brand_id') || $request->filled('brandId')) {
            $updateData['brand_id'] = $request->input('brand_id') ?? $request->input('brandId');
        }
        if ($request->has('is_active')) {
            $updateData['is_active'] = $request->boolean('is_active');
        } elseif ($request->has('status')) {
            $updateData['is_active'] = $request->input('status') === 'active';
        }

        $product->update($updateData);

        if ($request->filled('thumbnail')) {
            \App\Models\ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                ['image_url' => $request->thumbnail]
            );
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật sản phẩm thành công.',
            'data'    => $product->load(['brand', 'category', 'images']),
        ]);
    }

    /**
     * 5. XÓA SẢN PHẨM (DELETE /api/products/{id})
     */
    public function destroy(string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Sản phẩm không tồn tại.',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa sản phẩm thành công.',
        ]);
    }
}
