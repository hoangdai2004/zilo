# Zilo storefront

## Local setup

Use Node.js 20.19 or newer and PHP 8.4.1 or newer.

1. Copy `.env.example` to `.env` and set `VITE_API_URL` to the Laravel API URL. For a local backend, use `http://localhost:8000/api`.
2. Copy `server/.env.example` to `server/.env`. The defaults allow the local frontend origins (`localhost:3000` and `127.0.0.1:3000`) to use Laravel Sanctum's cookie-based session. If the frontend is hosted elsewhere, update `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS` to match its exact origin/host.
3. Start Laravel from `server/`:

   ```sh
   php artisan migrate
   php artisan serve --host=0.0.0.0
   ```

4. Start the frontend from `client/`:

   ```sh
   npm install
   npm start
   ```

The seeder does not create demo customers, products, categories, brands, or coupons. To provision an admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (at least 12 characters) in `server/.env`, then run `php artisan db:seed`. Do not reuse deployment credentials in local environments.
Authentication uses Laravel's HttpOnly session cookie; the browser client does not store bearer tokens. Keep frontend and backend on HTTPS in production and configure the allowed frontend origins explicitly.
The customer cart is local while signed out and is transferred to the account cart on login.
Checkout currently supports cash on delivery; online payment gateways need backend credentials and integration before they can be enabled.

## Available pages

- Storefront: home, product search/filter/details, cart, sign-in/sign-up, password recovery by email, checkout, and customer profile with orders, addresses, coupons, and wishlist.
- Footer information pages: about, careers, terms, privacy, help, buying guide, shipping, and returns.
- Admin (`/admin`): dashboard, orders and status transitions, customer list, products, categories, brands, and coupons. Admin APIs require an authenticated account with the `admin` role.
- The storefront header and footer are shared across store and information pages; sign-in/sign-up use their own focused layout, while admin pages use admin navigation. Header category links and storefront catalog are loaded from the backend. Online payment options remain disabled until a gateway is integrated.

## Production deployment checklist

- Set `APP_ENV=production`, `APP_DEBUG=false`, a unique generated `APP_KEY`, HTTPS `APP_URL`, and a persistent production database.
- Set `SESSION_SECURE_COOKIE=true`; configure `SESSION_DOMAIN`, `SESSION_SAME_SITE`, `SANCTUM_STATEFUL_DOMAINS`, and `CORS_ALLOWED_ORIGINS` for the real HTTPS frontend/API domains. Never allow broad or wildcard credentialed CORS origins.
- Provide the initial admin through deployment secrets (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`); do not use demo credentials. Run `php artisan db:seed` once to create it, then remove those seed credentials from the environment. Do not commit `.env` files.
- If an existing database was ever seeded with the old public demo admin password, rotate or deactivate that account before exposing the database.
- Build the frontend with its production `VITE_API_URL`, run migrations with `php artisan migrate --force`, then verify login, admin authorization, and COD checkout over HTTPS.
- Online payment gateways, email verification, and an online returns request flow are not currently implemented.

## Validation

```sh
npm run build
```
