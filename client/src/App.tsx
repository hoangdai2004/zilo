import React, { lazy, ReactNode, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ToastContainer from './components/ToastContainer';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const VNPayReturnPage = lazy(() => import('./pages/VNPayReturnPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminBrandsPage = lazy(() => import('./pages/admin/AdminBrandsPage'));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage'));

function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return <div className="container py-5 text-center" role="status">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (admin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return (
    <>
      <ToastContainer />
      <Suspense fallback={<div className="container py-5 text-center" role="status">Đang tải trang...</div>}>
        <Routes>
      {/* Khách hàng / Storefront */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="vnpay-return" element={<VNPayReturnPage />} />
        <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path=":slug" element={<InfoPage />} />
      </Route>

      {/* Authentication pages use their own focused layout */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Quản trị viên (Admin) */}
      <Route path="/admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="brands" element={<AdminBrandsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </>
  );
}
