import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';
import { Product } from '../types';
import MiniCartDrawer from './MiniCartDrawer';

export default function Header() {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const { user, isAuthenticated, isInitialized, logout } = useAuthStore();
  const { categories, wishlist, searchQuery, setSearchQuery, products } = useProductStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Debounce live search
  useEffect(() => {
    const query = localSearch.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      const filtered = products
        .filter((p) =>
          p.name.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query) ||
          p.brandName?.toLowerCase().includes(query)
        )
        .slice(0, 5);

      setSearchResults(filtered);
      setShowSearchDropdown(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [localSearch, products]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    setSearchQuery(localSearch);
    navigate(`/products?search=${encodeURIComponent(localSearch)}`);
  };

  const handleSelectProduct = (productId: string | number) => {
    setShowSearchDropdown(false);
    navigate(`/products/${productId}`);
  };

  return (
    <>
      <header className="bg-white border-bottom sticky-top shadow-sm" style={{ zIndex: 1040 }}>
        {/* Top Navbar */}
        <div className="container py-3">
          <div className="row align-items-center">
            {/* Logo */}
            <div className="col-6 col-md-3 col-lg-2">
              <Link to="/" className="brand-logo text-primary text-decoration-none fw-bold fs-3 d-flex align-items-center">
                <i className="bi bi-bag-check-fill me-2 fs-2"></i>
                <span>Zilo</span>
              </Link>
            </div>

            {/* Search Bar with Live Suggestions Dropdown */}
            <div className="col-12 col-md-6 col-lg-6 my-2 my-md-0 order-3 order-md-2 position-relative" ref={searchBoxRef}>
              <form onSubmit={handleSearchSubmit} className="input-group">
                <input
                  type="text"
                  className="form-control form-control-lg border-primary shadow-none"
                  placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => {
                    if (localSearch.trim().length >= 2) setShowSearchDropdown(true);
                  }}
                />
                <button className="btn btn-primary px-4" type="submit">
                  <i className="bi bi-search me-1"></i>
                </button>
              </form>

              {/* Live Search Dropdown */}
              {showSearchDropdown && (
                <div
                  className="position-absolute start-0 end-0 bg-white border rounded-3 shadow-lg p-2 mt-1 mx-2"
                  style={{ zIndex: 1060, top: '100%', maxHeight: '420px', overflowY: 'auto' }}
                >
                  {searchResults.length > 0 ? (
                    <div>
                      <div className="small text-muted px-2 py-1 fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                        Gợi ý sản phẩm ({searchResults.length})
                      </div>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="d-flex align-items-center gap-3 p-2 rounded-2 cursor-pointer hover-bg-light text-decoration-none"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelectProduct(product.id)}
                        >
                          <img
                            src={product.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                            alt={product.name}
                            className="rounded-2 border object-fit-cover flex-shrink-0"
                            style={{ width: '48px', height: '48px' }}
                          />
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold text-dark text-truncate small">{product.name}</div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-danger fw-bold small">
                                {product.price.toLocaleString('vi-VN')} ₫
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.75rem' }}>
                                  {product.originalPrice.toLocaleString('vi-VN')} ₫
                                </span>
                              )}
                              {product.categoryName && (
                                <span className="badge bg-light text-secondary border small ms-auto" style={{ fontSize: '0.7rem' }}>
                                  {product.categoryName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-top pt-2 mt-1 text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold"
                          onClick={handleSearchSubmit}
                        >
                          Xem tất cả kết quả cho &quot;{localSearch}&quot; →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-muted small">
                      <i className="bi bi-search me-1"></i> Không tìm thấy sản phẩm nào khớp với &quot;<strong>{localSearch}</strong>&quot;
                    </div>
                  )}
                </div>
              )}
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

              {/* Cart Button - Opens MiniCartDrawer */}
              <button
                type="button"
                className="btn btn-outline-light text-dark position-relative p-2 border-0 shadow-none"
                title="Giỏ hàng"
                onClick={() => setIsMiniCartOpen(true)}
              >
                <i className="bi bi-cart3 fs-4 text-primary"></i>
                {totalCartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {totalCartCount}
                  </span>
                )}
              </button>

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
            {isAuthenticated && user?.role === 'admin' && (
              <div className="d-none d-md-block flex-shrink-0">
                <Link to="/admin/products" className="badge bg-secondary-subtle text-secondary border text-decoration-none">
                  <i className="bi bi-gear-fill me-1"></i> Trang Admin
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Mini Cart Offcanvas Drawer */}
      <MiniCartDrawer isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
    </>
  );
}
