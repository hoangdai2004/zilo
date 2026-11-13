<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function ($user, string $token): string {
            return rtrim(config('services.frontend_url'), '/').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });

        ResetPassword::toMailUsing(function ($user, string $token): MailMessage {
            $url = rtrim(config('services.frontend_url'), '/').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);

            return (new MailMessage)
                ->subject('Đặt lại mật khẩu ShopHub')
                ->greeting('Xin chào '.$user->name.',')
                ->line('Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ShopHub của bạn.')
                ->action('Đặt lại mật khẩu', $url)
                ->line('Liên kết có hiệu lực trong '.config('auth.passwords.users.expire').' phút và chỉ sử dụng được một lần.')
                ->line('Nếu bạn không yêu cầu thay đổi mật khẩu, hãy bỏ qua email này.');
        });
    }
}
