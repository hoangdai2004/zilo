<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * UPLOAD HÌNH ẢNH (POST /api/upload)
     * Nhận file multipart/form-data với key là 'image'
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:5120', // Tối đa 5MB
        ]);

        $file = $request->file('image');
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

        // Lưu vào thư mục storage/app/public/uploads
        $path = $file->storeAs('uploads', $filename, 'public');

        // Sinh link URL công khai có thể truy cập qua trình duyệt
        $url = asset('storage/' . $path);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tải ảnh lên thành công.',
            'data'    => [
                'path' => $path,
                'url'  => $url,
            ],
        ], 201);
    }
}

