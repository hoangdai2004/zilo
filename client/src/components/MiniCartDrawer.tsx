import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCartDrawer({ isOpen, onClose }: MiniCartDrawerProps) {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getSubtotal } = useCartStore();

  if (!isOpen) return null;

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getSubtotal();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="offcanvas-backdrop fade show"
        style={{ zIndex: 1045 }}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div
        className="offcanvas offcanvas-end show shadow"
        tabIndex={-1}
        style={{ zIndex: 1050, width: '400px', maxWidth: '90vw' }}
        aria-labelledby="miniCartLabel"
      >
        <div className="offcanvas-header border-bottom py-3">
          <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2" id="miniCartLabel">
            <i className="bi bi-bag-check text-primary fs-4"></i>
            <span>Giỏ hàng ({totalCount})</span>
          </h5>
          <button type="button" className="btn-close text-reset shadow-none" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="offcanvas-body p-3 d-flex flex-column">
          {items.length === 0 ? (
            <div className="text-center my-auto py-5">
              <i className="bi bi-cart-x text-muted display-3 mb-3 d-block"></i>
              <p className="text-muted fw-semibold mb-3">Giỏ hàng của bạn đang trống</p>
              <button
                type="button"
                className="btn btn-primary px-4 rounded-pill"
                onClick={() => {
                  onClose();
                  navigate('/products');
                }}
              >
                Khám phá sản phẩm
              </button>
            </div>
          ) : (
            <div className="flex-grow-1 overflow-auto pe-1">
              {items.map((item) => (
                <div key={item.id} className="d-flex gap-3 py-3 border-bottom position-relative align-items-center">
                  <img
                    src={item.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120'}
                    alt={item.name}
                    className="rounded-3 border object-fit-cover flex-shrink-0"
                    style={{ width: '64px', height: '64px' }}
                  />
                  <div className="flex-grow-1 min-w-0">
                    <Link
                      to={`/products/${item.productId}`}
                      onClick={onClose}
                      className="text-dark fw-semibold text-decoration-none text-truncate d-block mb-1 small"
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                    {(item.color || item.storage) && (
                      <div className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                        {[item.color, item.storage].filter(Boolean).join(' - ')}
                      </div>
                    )}
                    <div className="d-flex align-items-center justify-content-between mt-1">
                      <div className="d-flex align-items-center border rounded">
                        <button
                          type="button"
                          className="btn btn-sm btn-light px-2 py-0 border-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="px-2 small fw-bold">{item.quantity}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-light px-2 py-0 border-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="fw-bold text-primary small">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-danger p-0 ms-1"
                    title="Xóa"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <i className="bi bi-trash3 fs-6"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="offcanvas-footer border-top p-3 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">Tạm tính:</span>
              <span className="fs-5 fw-bold text-danger">{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="d-grid gap-2">
              <button type="button" className="btn btn-primary py-2 fw-semibold" onClick={handleCheckout}>
                <i className="bi bi-credit-card me-2"></i> Tiến hành thanh toán
              </button>
              <button type="button" className="btn btn-outline-secondary py-2" onClick={handleViewCart}>
                Xem giỏ hàng đầy đủ
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
