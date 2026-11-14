<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Tất cả các route được đặt tiền tố tự động là /api/...
*/

// =========================================================================
// 1. XÁC THỰC (AUTH) - PUBLIC
// =========================================================================
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:3,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:3,1');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('login');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'sendPasswordResetLink'])->middleware('throttle:3,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

// =========================================================================
// 2. DANH MỤC & THƯƠNG HIỆU - PUBLIC
// =========================================================================
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{id}', [BrandController::class, 'show']);

// =========================================================================
// 3. SẢN PHẨM & ĐÁNH GIÁ - PUBLIC
// =========================================================================
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);

// =========================================================================
// 4. MÃ GIẢM GIÁ (COUPONS) - PUBLIC
// =========================================================================
Route::get('/coupons', [CouponController::class, 'index']);
Route::post('/coupons/check', [CouponController::class, 'check']);

// =========================================================================
// 5. CÁC ROUTES CẦN ĐĂNG NHẬP (AUTH:SANCTUM)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // --- Tài khoản cá nhân ---
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::get('/users/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/users/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- Sổ địa chỉ giao hàng ---
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::put('/addresses/{id}/default', [AddressController::class, 'setDefault']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);

    // --- Giỏ hàng (Cart) ---
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // --- Đơn hàng (Orders) & Thanh toán ---
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/checkout', [OrderController::class, 'checkout']);
    Route::post('/orders', [OrderController::class, 'checkout']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    // --- Danh sách yêu thích (Wishlist) ---
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);

    // --- Đánh giá sản phẩm ---
    Route::post('/products/{productId}/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // =====================================================================
    // 6. QUẢN TRỊ VIÊN (ADMIN CRUD - YÊU CẦU QUYỀN ADMIN)
    // =====================================================================
    Route::middleware('admin')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/customers', [AdminController::class, 'customers']);
        Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
        Route::put('/admin/orders/{id}/status', [OrderController::class, 'adminUpdateStatus']);
        Route::get('/admin/products', [ProductController::class, 'adminIndex']);
        Route::get('/admin/categories', [CategoryController::class, 'adminIndex']);
        Route::get('/admin/coupons', [CouponController::class, 'adminIndex']);
        Route::get('/admin/brands', [BrandController::class, 'adminIndex']);

        // Sản phẩm
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);

        // Danh mục
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Thương hiệu
        Route::post('/brands', [BrandController::class, 'store']);
        Route::put('/brands/{id}', [BrandController::class, 'update']);
        Route::delete('/brands/{id}', [BrandController::class, 'destroy']);

        // Mã giảm giá
        Route::post('/coupons', [CouponController::class, 'store']);
        Route::put('/coupons/{id}', [CouponController::class, 'update']);
        Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);

        // Upload hình ảnh
        Route::post('/upload', [UploadController::class, 'uploadImage']);
    });
});
