import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { title: 'Tổng quan', icon: 'bi-speedometer2', path: '/admin' },
    { title: 'Đơn hàng', icon: 'bi-receipt', path: '/admin/orders' },
    { title: 'Khách hàng', icon: 'bi-people', path: '/admin/customers' },
    { title: 'Sản phẩm', icon: 'bi-box-seam', path: '/admin/products' },
    { title: 'Danh mục', icon: 'bi-grid', path: '/admin/categories' },
    { title: 'Thương hiệu', icon: 'bi-tags', path: '/admin/brands' },
    { title: 'Mã giảm giá', icon: 'bi-tag', path: '/admin/coupons' },
    { title: 'Banner quảng cáo', icon: 'bi-image', path: '/admin/banners' },
  ];

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar d-flex flex-column flex-shrink-0 p-3" style={{ width: '260px' }}>
        <Link to="/admin" className="d-flex align-items-center mb-4 text-white text-decoration-none px-2 gap-2">
          <i className="bi bi-bag-check-fill text-primary fs-3"></i>
          <span className="fs-5 fw-bold">Zilo Admin</span>
        </Link>
        <hr className="text-secondary my-2" />
        <ul className="nav nav-pills flex-column mb-auto gap-1">
          {menuItems.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin' || location.pathname === '/admin/dashboard'
              : location.pathname.startsWith(item.path);
            return (
              <li className="nav-item" key={item.path}>
                <Link to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                  <i className={`bi ${item.icon} fs-5`}></i>
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <hr className="text-secondary my-3" />
        <div className="px-2">
          <Link to="/" className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mb-2">
            <i className="bi bi-shop"></i> Về cửa hàng
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between shadow-sm">
          <h5 className="mb-0 fw-bold text-dark">Hệ thống quản trị Zilo</h5>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={user?.name || 'Admin'}
                className="rounded-circle border"
                style={{ width: '38px', height: '38px', objectFit: 'cover' }}
              />
              <div className="d-none d-sm-block text-start">
                <div className="fw-semibold text-dark small">{user?.name || 'Admin'}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Quản trị viên</div>
              </div>
            </div>
            <button onClick={logout} className="btn btn-outline-danger btn-sm" title="Đăng xuất">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="p-4 flex-grow-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
