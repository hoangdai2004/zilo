import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';

export default function Header() {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const { user, isAuthenticated, isInitialized, logout } = useAuthStore();
  const { categories, wishlist, searchQuery, setSearchQuery } = useProductStore();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    navigate(`/products?search=${encodeURIComponent(localSearch)}`);
  };

  return (
    <header className="bg-white border-bottom sticky-top shadow-sm">
      {/* Top Navbar */}
      <div className="container py-3">
        <div className="row align-items-center">
          {/* Logo */}
          <div className="col-6 col-md-3 col-lg-2">
            <Link to="/" className="brand-logo text-primary text-decoration-none fw-bold fs-3 d-flex align-items-center">
              <i className="bi bi-bag-check-fill me-2 fs-2"></i>
              <span>ShopHub</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="col-12 col-md-6 col-lg-6 my-2 my-md-0 order-3 order-md-2">
            <form onSubmit={handleSearchSubmit} className="input-group">
              <input
                type="text"
                className="form-control form-control-lg border-primary"
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button className="btn btn-primary px-4" type="submit">
                <i className="bi bi-search me-1"></i>
              </button>
            </form>
          </div>

          {/* User & Actions */}
          <div className="col-6 col-md-3 col-lg-4 text-end order-2 order-md-3 d-flex align-items-center justify-content-end gap-3">
            {/* Wishlist */}
            <Link to="/profile?tab=wishlist" className="btn btn-outline-light text-dark position-relative p-2" title="Yêu thích">
              <i className="bi bi-heart fs-4 text-muted"></i>
              {wishlist.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="btn btn-outline-light text-dark position-relative p-2" title="Giỏ hàng">
              <i className="bi bi-cart3 fs-4 text-primary"></i>
              {totalCartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {totalCartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Auth */}
            {!isInitialized ? (
              <span className="text-muted small" role="status">Đang kiểm tra phiên...</span>
            ) : isAuthenticated && user ? (
              <div className="dropdown">
                <button
                  className="btn btn-light d-flex align-items-center gap-2 border dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={user.name}
                    className="rounded-circle"
                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                  />
                  <span className="d-none d-lg-inline fw-semibold text-truncate" style={{ maxWidth: '120px' }}>
                    {user.name}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                  <li>
                    <Link className="dropdown-item py-2" to="/profile">
                      <i className="bi bi-person me-2"></i> Tài khoản cá nhân
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" to="/cart">
                      <i className="bi bi-bag me-2"></i> Giỏ hàng ({totalCartCount})
                    </Link>
                  </li>
                  {user.role === 'admin' && (
                    <li>
                      <Link className="dropdown-item py-2 text-primary fw-semibold" to="/admin/products">
                        <i className="bi bi-shield-lock me-2"></i> Quản trị Admin
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item py-2 text-danger" onClick={logout}>
                      <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/sign-in" className="btn btn-outline-primary btn-sm px-3">
                  Đăng nhập
                </Link>
                <Link to="/sign-up" className="btn btn-primary btn-sm px-3 d-none d-sm-inline-block">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-header navigation */}
      <nav className="bg-light border-top py-2" aria-label="Danh mục sản phẩm">
        <div className="container d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3 gap-md-4 overflow-auto text-nowrap py-1">
            <Link to="/products" className="fw-bold text-dark d-flex align-items-center gap-2">
              <i className="bi bi-grid-fill text-primary"></i> Danh mục sản phẩm
            </Link>
            {categories.slice(0, 4).map((category) => (
              <Link key={category.id} to={`/products?category=${category.id}`} className="text-secondary small">
                {category.name}
              </Link>
            ))}
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <Link to="/learn-zustand" className="badge bg-success-subtle text-success border border-success-subtle text-decoration-none">
              🐻 Học Zustand
            </Link>
            {/* Chỉ hiện nút Admin khi user đã đăng nhập và có role admin */}
            {isAuthenticated && user?.role === 'admin' && (
              <div className="d-none d-md-block">
                <Link to="/admin/products" className="badge bg-secondary-subtle text-secondary border text-decoration-none">
                  <i className="bi bi-gear-fill me-1"></i> Trang Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
