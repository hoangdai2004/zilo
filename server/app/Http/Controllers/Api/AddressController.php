<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * 1. DANH SÁCH ĐỊA CHỈ GIAO HÀNG (GET /api/addresses)
     */
    public function index(Request $request)
    {
        $addresses = Address::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $addresses,
        ]);
    }

    /**
     * 2. THÊM ĐỊA CHỈ MỚI (POST /api/addresses)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'recipient_name' => 'required|string|max:255',
            'phone'          => 'required|string|max:20',
            'address_line'   => 'required|string',
            'city'           => 'required|string|max:100',
            'district'       => 'required|string|max:100',
            'ward'           => 'required|string|max:100',
            'is_default'     => 'nullable|boolean',
        ]);

        $isDefault = $validated['is_default'] ?? false;

        // Nếu là địa chỉ đầu tiên hoặc được tick là mặc định -> reset các địa chỉ cũ
        if ($isDefault || Address::where('user_id', $user->id)->count() === 0) {
            Address::where('user_id', $user->id)->update(['is_default' => false]);
            $isDefault = true;
        }

        $address = Address::create([
            'user_id'        => $user->id,
            'recipient_name' => $validated['recipient_name'],
            'phone'          => $validated['phone'],
            'address_line'   => $validated['address_line'],
            'city'           => $validated['city'],
            'district'       => $validated['district'],
            'ward'           => $validated['ward'],
            'is_default'     => $isDefault,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Thêm địa chỉ thành công.',
            'data'    => $address,
        ], 201);
    }

    /**
     * 3. CẬP NHẬT ĐỊA CHỈ (PUT /api/addresses/{id})
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $address = Address::where('id', $id)->where('user_id', $user->id)->first();

        if (!$address) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Địa chỉ không tồn tại.',
            ], 404);
        }

        $validated = $request->validate([
            'recipient_name' => 'sometimes|required|string|max:255',
            'phone'          => 'sometimes|required|string|max:20',
            'address_line'   => 'sometimes|required|string',
            'city'           => 'sometimes|required|string|max:100',
            'district'       => 'sometimes|required|string|max:100',
            'ward'           => 'sometimes|required|string|max:100',
            'is_default'     => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            Address::where('user_id', $user->id)->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật địa chỉ thành công.',
            'data'    => $address,
        ]);
    }

    /**
     * 4. ĐẶT LÀM ĐỊA CHỈ MẶC ĐỊNH (PUT /api/addresses/{id}/default)
     */
    public function setDefault(Request $request, string $id)
    {
        $user = $request->user();
        $address = Address::where('id', $id)->where('user_id', $user->id)->first();

        if (!$address) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Địa chỉ không tồn tại.',
            ], 404);
        }

        Address::where('user_id', $user->id)->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã đặt làm địa chỉ mặc định.',
            'data'    => $address,
        ]);
    }

    /**
     * 5. XÓA ĐỊA CHỈ (DELETE /api/addresses/{id})
     */
    public function destroy(Request $request, string $id)
    {
        $address = Address::where('id', $id)->where('user_id', $request->user()->id)->first();

        if (!$address) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Địa chỉ không tồn tại.',
            ], 404);
        }

        $address->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Xóa địa chỉ thành công.',
        ]);
    }
}

