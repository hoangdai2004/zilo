import React from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';

export default function Footer() {
  const { categories, products } = useProductStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-top mt-5">
      {/* 4 Feature Highlights matching design */}
      <div className="border-bottom py-4 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-md-3 d-flex align-items-center gap-3">
              <div className="bg-primary-subtle text-primary p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-truck"></i>
              </div>
              <div>
                <h6 className="mb-1 fw-bold text-dark">Miễn phí vận chuyển</h6>
                <small className="text-muted">Cho đơn từ 500.000đ</small>
              </div>
            </div>

            <div className="col-6 col-md-3 d-flex align-items-center gap-3">
              <div className="bg-success-subtle text-success p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-arrow-repeat"></i>
              </div>
              <div>
                <h6 className="mb-1 fw-bold text-dark">Đổi trả trong 7 ngày</h6>
                <small className="text-muted">Nếu có lỗi từ NSX</small>
              </div>
            </div>

            <div className="col-6 col-md-3 d-flex align-items-center gap-3">
              <div className="bg-warning-subtle text-warning p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <div>
                <h6 className="mb-1 fw-bold text-dark">Thanh toán an toàn</h6>
                <small className="text-muted">COD, VNPay, MoMo</small>
              </div>
            </div>

            <div className="col-6 col-md-3 d-flex align-items-center gap-3">
              <div className="bg-info-subtle text-info p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-headset"></i>
              </div>
              <div>
                <h6 className="mb-1 fw-bold text-dark">Hỗ trợ 24/7</h6>
                <small className="text-muted">Luôn sẵn sàng phục vụ</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <Link to="/" className="brand-logo text-primary text-decoration-none fw-bold fs-3 d-flex align-items-center mb-3">
              <i className="bi bi-bag-check-fill me-2 fs-2"></i>
              <span>ShopHub</span>
            </Link>
            <p className="text-muted small pe-md-4">
              ShopHub - Nền tảng thương mại điện tử hàng đầu cung cấp sản phẩm chính hãng, chất lượng cao với mức giá tốt nhất mỗi ngày.
            </p>
            {products.length > 0 && (
              <p className="text-muted small mb-3">
                <i className="bi bi-box-seam text-primary me-1"></i>
                Hơn <strong className="text-dark">{products.length.toLocaleString('vi-VN')}</strong> sản phẩm chính hãng đang bán
              </p>
            )}
            <div className="d-flex gap-3 fs-5 text-muted">
              <Link to="/help" className="text-primary" aria-label="Trung tâm trợ giúp"><i className="bi bi-question-circle"></i></Link>
              <Link to="/products" className="text-secondary" aria-label="Sản phẩm"><i className="bi bi-bag"></i></Link>
            </div>
          </div>

          {/* Danh mục sản phẩm lấy từ Backend */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold mb-3">Danh mục sản phẩm</h6>
            {categories.length > 0 ? (
              <ul className="list-unstyled small text-muted d-flex flex-column gap-2">
                {categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/products?category=${cat.id}`}
                      className="text-muted text-decoration-none d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-chevron-right text-primary" style={{ fontSize: '0.7rem' }}></i>
                      <span>{cat.name}</span>
                      {cat.count ? <span className="opacity-50">({cat.count})</span> : null}
                    </Link>
                  </li>
                ))}
                {categories.length > 6 && (
                  <li>
                    <Link to="/products" className="text-primary text-decoration-none small fw-semibold">
                      Xem tất cả <i className="bi bi-arrow-right"></i>
                    </Link>
                  </li>
                )}
              </ul>
            ) : (
              <ul className="list-unstyled small text-muted d-flex flex-column gap-2">
                <li><Link to="/products" className="text-muted text-decoration-none">Tất cả sản phẩm</Link></li>
              </ul>
            )}
          </div>

          <div className="col-6 col-md-2">
            <h6 className="fw-bold mb-3">Hỗ trợ khách hàng</h6>
            <ul className="list-unstyled small text-muted d-flex flex-column gap-2">
              <li><Link to="/about" className="text-muted text-decoration-none">Giới thiệu</Link></li>
              <li><Link to="/help" className="text-muted text-decoration-none">Trung tâm trợ giúp</Link></li>
              <li><Link to="/buying-guide" className="text-muted text-decoration-none">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/shipping" className="text-muted text-decoration-none">Chính sách vận chuyển</Link></li>
              <li><Link to="/returns" className="text-muted text-decoration-none">Chính sách đổi trả</Link></li>
            </ul>
          </div>

          <div className="col-12 col-md-3">
            <h6 className="fw-bold mb-3">Phương thức thanh toán</h6>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge bg-light text-dark border p-2">COD (Tiền mặt)</span>
              <span className="badge bg-light text-dark border p-2">VNPay</span>
              <span className="badge bg-light text-dark border p-2">MoMo</span>
              <span className="badge bg-light text-dark border p-2">Visa / Master</span>
            </div>
            <h6 className="fw-bold mb-2">Hotline hỗ trợ</h6>
            <a href="tel:19006868" className="text-primary fw-bold fs-5 text-decoration-none">1900 6868</a>
            <p className="text-muted small mb-0">8h00 - 21h00 (Hàng ngày)</p>
          </div>
        </div>
      </div>

      <div className="bg-light py-3 border-top text-center text-muted small">
        © {currentYear} ShopHub E-Commerce. {categories.length > 0 && `Đang có ${categories.length} danh mục & ${products.length} sản phẩm.`}
      </div>
    </footer>
  );
}
