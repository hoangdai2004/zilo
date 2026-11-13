<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        $completedOrders = Order::whereNotIn('status', ['cancelled']);
        $recentOrders = Order::with('user:id,name,email')
            ->with(['items.product.images', 'latestPayment'])
            ->latest()
            ->limit(8)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'products_count' => Product::count(),
                'active_products_count' => Product::where('is_active', true)->count(),
                'customers_count' => User::where('role', 'user')->count(),
                'orders_count' => Order::count(),
                'pending_orders_count' => Order::where('status', 'pending')->count(),
                'revenue' => (float) $completedOrders->sum('total_amount'),
                'last_30_days_revenue' => (float) Order::whereNotIn('status', ['cancelled'])
                    ->where('created_at', '>=', now()->subDays(30))
                    ->sum('total_amount'),
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    public function customers(Request $request)
    {
        $query = User::where('role', 'user')
            ->withCount('orders')
            ->withSum([
                'orders as total_spent' => fn ($orders) => $orders->whereNotIn('status', ['cancelled']),
            ], 'total_amount')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($users) use ($search) {
                $users->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(20),
        ]);
    }
}
