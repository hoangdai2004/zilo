<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminEmail = config('services.admin.email');
        $adminPassword = config('services.admin.password');

        if (!$adminEmail && !$adminPassword) {
            if (app()->environment('production') && !User::where('role', 'admin')->where('is_active', true)->exists()) {
                throw new RuntimeException('Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding a production database without an active administrator.');
            }

            return;
        }

        if (!$adminEmail || !$adminPassword || mb_strlen($adminPassword) < 12) {
            throw new RuntimeException('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters to seed the administrator.');
        }

        $existingAdmin = User::where('email', $adminEmail)->first();
        if ($existingAdmin && $existingAdmin->role !== 'admin') {
            throw new RuntimeException('ADMIN_EMAIL belongs to an account that is not an administrator.');
        }

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => config('services.admin.name', 'ShopHub Administrator'),
                'password' => $adminPassword,
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }
}
