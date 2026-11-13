<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * 1. DANH SÁCH MÃ GIẢM GIÁ ĐANG ÁP DỤNG (GET /api/coupons)
     */
    public function index()
    {
        $coupons = Coupon::where('is_active', true)
            ->withCount('orders')
            ->latest()
            ->get()
            ->filter(fn (Coupon $coupon) => $coupon->max_uses === null || $coupon->orders_count < $coupon->max_uses)
            ->values();

        return response()->json([
            'status' => 'success',
            'data'   => $coupons,
        ]);
    }

    public function adminIndex()
    {
        return response()->json([
            'status' => 'success',
            'data'   => Coupon::withCount('orders')->latest()->get(),
        ]);
    }

    /**
     * 2. KIỂM TRA & TÍNH TOÁN MÃ GIẢM GIÁ (POST /api/coupons/check)
     */
    public function check(Request $request)
    {
        $validated = $request->validate([
            'code'         => 'required|string',
            'order_amount' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::withCount('orders')->where('code', strtoupper($validated['code']))
            ->where('is_active', true)
            ->first();

        if (!$coupon || ($coupon->max_uses !== null && $coupon->orders_count >= $coupon->max_uses)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực.',
            ], 404);
        }

        $orderAmount = (float) $validated['order_amount'];

        if ($orderAmount < $coupon->min_order_value) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Đơn hàng chưa đạt giá trị tối thiểu ' . number_format($coupon->min_order_value) . 'đ để áp dụng mã này.',
            ], 422);
        }

        // Tính số tiền được giảm
        if ($coupon->discount_type === 'percentage') {
            $discountAmount = ($orderAmount * $coupon->discount_value) / 100;
        } else {
            $discountAmount = min($coupon->discount_value, $orderAmount);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Áp dụng mã giảm giá thành công.',
            'data'    => [
                'coupon'          => $coupon,
                'discount_amount' => (float) $discountAmount,
                'final_amount'    => (float) max(0, $orderAmount - $discountAmount),
            ],
        ]);
    }

    /**
     * 3. TẠO MÃ GIẢM GIÁ (POST /api/coupons)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'            => 'required|string|unique:coupons,code|max:50',
            'discount_type'   => 'required|in:fixed,percentage',
            'discount_value'  => 'required|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_uses'        => 'nullable|integer|min:1',
            'is_active'       => 'nullable|boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $coupon = Coupon::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tạo mã giảm giá thành công.',
            'data'    => $coupon,
        ], 201);
    }

    /**
     * 4. CẬP NHẬT MÃ GIẢM GIÁ (PUT /api/coupons/{id})
     */
    public function update(Request $request, string $id)
    {
        $coupon = Coupon::find($id);

        if (!$coupon) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Mã giảm giá không tồn tại.',
            ], 404);
        }

        $validated = $request->validate([
            'code'            => 'sometimes|required|string|max:50|unique:coupons,code,' . $coupon->id,
            'discount_type'   => 'sometimes|required|in:fixed,percentage',
            'discount_value'  => 'sometimes|required|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_uses'        => 'nullable|integer|min:1',
            'is_active'       => 'sometimes|boolean',
        ]);

        if (!empty($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $coupon->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật mã giảm giá thành công.',
            'data'    => $coupon,
        ]);
    }

    /**
     * 5. XÓA MÃ GIẢM GIÁ (DELETE /api/coupons/{id})
     */
    public function destroy(string $id)
    {
        $coupon = Coupon::find($id);

        if (!$coupon) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Mã giảm giá không tồn tại.',
            ], 404);
        }

        $coupon->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa mã giảm giá thành công.',
        ]);
    }
}
