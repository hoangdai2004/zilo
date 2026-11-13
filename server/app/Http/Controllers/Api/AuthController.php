<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function sendPasswordResetLink(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|max:255',
        ]);

        Password::sendResetLink(['email' => $validated['email']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Nếu email này đã đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:12|confirmed',
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                if (!$user->is_active) {
                    throw ValidationException::withMessages([
                        'email' => ['Tài khoản không thể đặt lại mật khẩu.'],
                    ]);
                }

                DB::transaction(function () use ($user, $password): void {
                    $user->forceFill([
                        'password' => $password,
                        'remember_token' => Str::random(60),
                    ])->save();
                    $user->tokens()->delete();

                    $sessionTable = config('session.table', 'sessions');
                    if (config('session.driver') === 'database' && Schema::hasTable($sessionTable)) {
                        DB::table($sessionTable)->where('user_id', $user->getKey())->delete();
                    }
                });
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => ['Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng.'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.',
        ]);
    }

    /**
     * 1. ĐĂNG KÝ TÀI KHOẢN (POST /api/register)
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:12',
            'phone'    => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => $validated['password'], // Tự động hash do Model có cast 'password' => 'hashed'
            'phone'     => $validated['phone'] ?? null,
            'role'      => 'user',
            'is_active' => true,
        ]);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'status'  => 'success',
            'message' => 'Đăng ký tài khoản thành công.',
            'data'    => [
                'user' => $user,
            ],
        ], 201);
    }

    /**
     * 2. ĐĂNG NHẬP (POST /api/login)
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Email hoặc mật khẩu không chính xác.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tài khoản của bạn đã bị vô hiệu hóa.',
            ], 403);
        }

        $user->tokens()->where('name', 'auth_token')->delete();
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'status'  => 'success',
            'message' => 'Đăng nhập thành công.',
            'data'    => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * 3. LẤY THÔNG TIN TÀI KHOẢN (GET /api/profile)
     */
    public function profile(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data'   => $request->user()->load('addresses'),
        ]);
    }

    /**
     * 4. CẬP NHẬT THÔNG TIN CÁ NHÂN (PUT /api/profile)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật thông tin thành công.',
            'data'    => $user,
        ]);
    }

    /**
     * 5. ĐỔI MẬT KHẨU (POST /api/change-password)
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:12|different:current_password',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Mật khẩu hiện tại không đúng.',
            ], 422);
        }

        $user->update(['password' => $validated['new_password']]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Đổi mật khẩu thành công.',
        ]);
    }

    /**
     * 6. ĐĂNG XUẤT (POST /api/logout)
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status'  => 'success',
            'message' => 'Đăng xuất thành công.',
        ]);
    }
}
