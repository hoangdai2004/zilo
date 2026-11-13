<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // Bỏ id, created_at, updated_at ra khỏi fillable
    protected $fillable = [
        'brand_id',
        'category_id',
        'slug',
        'name',
        'description',
        'price',
        'discount_price',
        'stock',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'stock' => 'integer',
        ];
    }

    // ================= RELATIONSHIPS =================

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    // ================= ACCESSORS (Thuộc tính ảo) =================

    // Giá bán thực tế (nếu có giảm giá thì lấy giá giảm, không thì giá gốc)
    public function getFinalPriceAttribute()
    {
        return ($this->discount_price && $this->discount_price < $this->price)
            ? $this->discount_price
            : $this->price;
    }

    // Kiểm tra có đang giảm giá không
    public function getHasDiscountAttribute(): bool
    {
        return $this->discount_price !== null && $this->discount_price < $this->price;
    }

    // % giảm giá (chỉ giữ 1 hàm duy nhất)
    public function getDiscountPercentageAttribute(): float
    {
        if ($this->has_discount && $this->price > 0) {
            return round((($this->price - $this->discount_price) / $this->price) * 100, 2);
        }
        return 0;
    }

    // Trạng thái còn hàng / hết hàng
    public function getStockStatusAttribute(): string
    {
        return $this->stock > 0 ? 'In Stock' : 'Out of Stock';
    }

    public function getIsAvailableAttribute(): bool
    {
        return $this->stock > 0 && $this->is_active;
    }

    // Lấy điểm đánh giá trung bình (Dùng collection để tránh N+1 Query)
    public function getAverageRatingAttribute(): float
    {
        return round((float) $this->reviews->avg('rating'), 1);
    }

    // Số lượt đánh giá
    public function getReviewCountAttribute(): int
    {
        return $this->reviews->count();
    }

    // Kiểm tra có phân loại / biến thể không
    public function getHasVariantsAttribute(): bool
    {
        return $this->variants->isNotEmpty();
    }

    // Lấy ảnh đại diện chính (hoặc ảnh đầu tiên nếu chưa set primary)
    public function getPrimaryImageAttribute(): ?string
    {
        $primary = $this->images->firstWhere('is_primary', true);
        return $primary?->image_url ?? $this->images->first()?->image_url;
    }

    // Lấy danh sách link album ảnh phụ
    public function getGalleryImagesAttribute(): array
    {
        return $this->images->where('is_primary', false)->pluck('image_url')->toArray();
    }
}
