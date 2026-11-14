import React from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { products, categories, setSelectedCategory, isLoading, error } = useProductStore();

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="container py-4">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {/* Top Hero Section: Category Sidebar + Banner */}
      <div className="row g-4 mb-4">
        {/* Left Category Sidebar (Khớp ảnh thiết kế) */}
        <div className="col-12 col-lg-3 d-none d-lg-block">
          <div className="card sh-card border-0 h-100 p-2">
            <div className="p-2 border-bottom fw-bold text-dark d-flex align-items-center gap-2">
              <i className="bi bi-list-ul text-primary fs-5"></i>
              <span>Danh mục sản phẩm</span>
            </div>
            <div className="d-flex flex-column gap-1 mt-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="cat-item text-decoration-none"
                >
                  <i className={`bi ${cat.icon || 'bi-chevron-right'} text-primary`}></i>
                  <span className="flex-grow-1">{cat.name}</span>
                  {cat.count && <small className="text-muted">({cat.count})</small>}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Banner Slider / Promotion (Khớp thiết kế banner xanh) */}
        <div className="col-12 col-lg-9">
          <div
            className="hero-banner p-5 rounded-4 text-white d-flex flex-column justify-content-center position-relative overflow-hidden shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
              minHeight: '380px'
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-7 z-1">
                <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3">
                  🔥 Khuyến mãi tuần lễ vàng
                </span>
                <h1 className="fw-bolder display-5 mb-3 text-white">
                  Sản phẩm chất lượng<br />Giá tốt mỗi ngày
                </h1>
                <p className="fs-6 opacity-75 mb-4 text-white">
                  Mua sắm thông minh - Cuộc sống tiện nghi với hàng ngàn ưu đãi chính hãng lên đến 50%.
                </p>
                <Link to="/products" className="btn btn-light btn-lg text-primary fw-bold px-4 py-2 rounded-pill shadow">
                  Mua ngay <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
              <div className="col-md-5 d-none d-md-block text-center z-1">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"
                  alt="Tech gadgets"
                  className="img-fluid rounded-4 shadow-lg"
                  style={{ maxHeight: '280px', objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Decorative background circle */}
            <div
              className="position-absolute rounded-circle"
              style={{
                width: '400px',
                height: '400px',
                right: '-80px',
                top: '-100px',
                background: 'rgba(255, 255, 255, 0.08)',
                zIndex: 0
              }}
            />
          </div>

          {/* 4 Feature Badges Under Banner */}
          <div className="row g-2 mt-2">
            <div className="col-6 col-md-3">
              <div className="bg-white p-2 rounded-3 border text-center small text-muted d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-truck text-primary"></i> Miễn phí vận chuyển
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white p-2 rounded-3 border text-center small text-muted d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-arrow-repeat text-success"></i> Đổi trả 7 ngày
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white p-2 rounded-3 border text-center small text-muted d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-shield-check text-warning"></i> Thanh toán an toàn
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white p-2 rounded-3 border text-center small text-muted d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-headset text-info"></i> Hỗ trợ 24/7
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section (Sản phẩm nổi bật) */}
      <div className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Sản phẩm nổi bật</h3>
            <p className="text-muted small mb-0">Các mặt hàng bán chạy nhất được khách hàng tin dùng</p>
          </div>
          <Link to="/products" className="btn btn-outline-primary btn-sm fw-semibold">
            Xem tất cả <i className="bi bi-chevron-right"></i>
          </Link>
        </div>

        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xxl-5 g-4">
          {isLoading && <div className="col-12 text-center text-muted py-4">Đang tải sản phẩm...</div>}
          {!isLoading && featuredProducts.length === 0 && <div className="col-12 text-center text-muted py-4">Chưa có sản phẩm đang kinh doanh.</div>}
          {featuredProducts.map((product) => (
            <div className="col" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}