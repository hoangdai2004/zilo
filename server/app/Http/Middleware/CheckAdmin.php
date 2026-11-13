<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdmin
{
    /**
     * Handle an incoming request.
     * Kiểm tra user hiện tại có role là 'admin' hay không.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Bạn không có quyền thực hiện hành động này (Yêu cầu quyền Quản trị viên).',
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tài khoản quản trị viên của bạn đã bị vô hiệu hóa.',
            ], 403);
        }

        return $next($request);
    }
}
