import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import ProductCard from '../components/ProductCard';
import { Banner } from '../types';
import { api } from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function HomePage() {
  useDocumentTitle('Trang chủ');
  const { products, categories, setSelectedCategory, error } = useProductStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const featuredProducts = products.slice(0, 8);

  // Tải danh sách banner từ database
  useEffect(() => {
    let active = true;
    api.banners.getAll().then((data) => {
      if (active && data.length > 0) {
        setBanners(data);
      }
    }).catch(() => {
      // Dùng fallback mặc định nếu chưa có kết nối
    });
    return () => { active = false; };
  }, []);

  // Tự động chuyển banner sau 5 giây nếu có nhiều hơn 1 banner
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[activeBannerIndex];

  return (
    <div className="container py-4">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {/* Top Hero Section: Category Sidebar + Dynamic Banner Slider */}
      <div className="row g-4 mb-4">
        {/* Left Category Sidebar */}
        <div className="col-12 col-lg-3 d-none d-lg-block">
          <div className="card sh-card border-0 h-100 p-2 shadow-sm">
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

        {/* Hero Banner Slider / Promotion */}
        <div className="col-12 col-lg-9">
          <div
            className="hero-banner p-4 p-md-5 rounded-4 text-white d-flex flex-column justify-content-center position-relative overflow-hidden shadow-sm"
            style={{
              background: currentBanner?.imageUrl
                ? `linear-gradient(rgba(10, 30, 80, 0.75), rgba(10, 30, 80, 0.75)), url(${currentBanner.imageUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
              minHeight: '380px',
              transition: 'background 0.5s ease',
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-8 z-1">
                <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3">
                  🔥 Ưu đãi nổi bật
                </span>
                <h1 className="fw-bolder display-5 mb-3 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {currentBanner?.title || 'Sản phẩm chất lượng - Giá tốt mỗi ngày'}
                </h1>
                <p className="fs-6 opacity-90 mb-4 text-white" style={{ maxWidth: '520px' }}>
                  {currentBanner?.description || 'Mua sắm thông minh - Cuộc sống tiện nghi với hàng ngàn ưu đãi chính hãng lên đến 50%.'}
                </p>
                <Link
                  to={currentBanner?.linkUrl || '/products'}
                  className="btn btn-light btn-lg text-primary fw-bold px-4 py-2 rounded-pill shadow"
                >
                  Khám phá ngay <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            {/* Banner Carousel Controls */}
            {banners.length > 1 && (
              <div className="position-absolute bottom-0 end-0 p-3 z-2 d-flex align-items-center gap-2">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Banner ${idx + 1}`}
                    className={`btn p-0 rounded-pill border-0 ${idx === activeBannerIndex ? 'bg-white' : 'bg-white opacity-50'}`}
                    style={{ width: idx === activeBannerIndex ? '28px' : '10px', height: '10px', transition: 'all 0.3s' }}
                    onClick={() => setActiveBannerIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 4 Feature Badges Under Banner */}
          <div className="row g-2 mt-2">
            <div className="col-6 col-md-3">
              <div className="card sh-card border-0 p-3 h-100 d-flex flex-row align-items-center gap-3">
                <i className="bi bi-truck fs-3 text-primary"></i>
                <div>
                  <div className="fw-bold small text-dark">Miễn phí vận chuyển</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Đơn hàng từ 500k</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card sh-card border-0 p-3 h-100 d-flex flex-row align-items-center gap-3">
                <i className="bi bi-shield-check fs-3 text-success"></i>
                <div>
                  <div className="fw-bold small text-dark">100% Chính hãng</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Bảo hành 12-24 tháng</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card sh-card border-0 p-3 h-100 d-flex flex-row align-items-center gap-3">
                <i className="bi bi-arrow-repeat fs-3 text-warning"></i>
                <div>
                  <div className="fw-bold small text-dark">Đổi trả 30 ngày</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Thủ tục nhanh gọn</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card sh-card border-0 p-3 h-100 d-flex flex-row align-items-center gap-3">
                <i className="bi bi-headset fs-3 text-danger"></i>
                <div>
                  <div className="fw-bold small text-dark">Hỗ trợ 24/7</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Tư vấn tận tình</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0 text-dark">Sản phẩm nổi bật</h3>
            <small className="text-muted">Các sản phẩm bán chạy nhất tuần qua</small>
          </div>
          <Link to="/products" className="btn btn-outline-primary btn-sm px-3 rounded-pill">
            Xem tất cả <i className="bi bi-chevron-right ms-1"></i>
          </Link>
        </div>

        <div className="row g-3">
          {featuredProducts.map((product) => (
            <div className="col-6 col-md-4 col-lg-3" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
          {!featuredProducts.length && (
            <div className="col-12 text-center py-5 text-muted">
              Đang tải danh sách sản phẩm...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
