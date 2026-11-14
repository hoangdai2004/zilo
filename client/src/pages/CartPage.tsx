import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    coupon,
    error,
    isLoading,
    updateQuantity,
    removeFromCart,
    toggleSelectItem,
    toggleSelectAll,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getTotal,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);

  const allSelected = items.length > 0 && items.every((i) => i.selected);
  const selectedCount = items.filter((i) => i.selected).length;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    void applyCoupon(couponCode).then((res) => {
      setCouponMsg({ text: res.message, error: !res.success });
      if (res.success) setCouponCode('');
    });
  };

  if (isLoading && items.length === 0) {
    return <div className="container py-5 text-center text-muted" role="status">Đang tải giỏ hàng...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <div className="card sh-card border-0 p-5 mx-auto" style={{ maxWidth: '500px' }}>
          <i className="bi bi-cart-x text-muted display-1 mb-3"></i>
          <h4 className="fw-bold">Giỏ hàng của bạn đang trống!</h4>
          <p className="text-muted small">Hãy khám phá hàng ngàn sản phẩm chất lượng tại ShopHub ngay bây giờ.</p>
          <Link to="/products" className="btn btn-primary mt-2">
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">
        Giỏ hàng <span className="fs-5 text-muted fw-normal">({items.length} sản phẩm)</span>
      </h3>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="row g-4">
        {/* Left Column: Cart Items List */}
        <div className="col-12 col-lg-8">
          <div className="card sh-card border-0 mb-3 p-3">
            <div className="form-check d-flex align-items-center gap-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="selectAll"
                checked={allSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
              <label className="form-check-label fw-semibold small" htmlFor="selectAll">
                Chọn tất cả ({items.length} sản phẩm)
              </label>
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            {items.map((item) => (
              <div key={item.id} className="card sh-card border-0 p-3">
                <div className="row align-items-center g-3">
                  {/* Checkbox */}
                  <div className="col-auto">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={item.selected}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                  </div>

                  {/* Thumbnail */}
                  <div className="col-auto">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="rounded border"
                      style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    />
                  </div>

                  {/* Name and Variant */}
                  <div className="col-12 col-sm">
                    <h6 className="fw-bold mb-1 text-truncate">
                      <Link to={`/products/${item.productId}`} className="text-dark text-decoration-none">
                        {item.name}
                      </Link>
                    </h6>
                    <div className="small text-muted mb-2">
                      {item.color && <span className="me-2">Màu: {item.color}</span>}
                      {item.storage && <span>{item.storage}</span>}
                    </div>
                    <div className="fw-bold text-danger">
                      {item.price.toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="col-auto">
                    <div className="input-group input-group-sm" style={{ width: '110px' }}>
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="form-control text-center bg-white"
                        value={item.quantity}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total price for this row */}
                  <div className="col-auto text-end" style={{ minWidth: '120px' }}>
                    <div className="fw-bold text-dark fs-6">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-link btn-sm text-danger p-0 mt-1 text-decoration-none"
                    >
                      <i className="bi bi-trash"></i> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Link to="/products" className="text-primary text-decoration-none small fw-semibold">
              <i className="bi bi-arrow-left me-1"></i> Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Voucher */}
        <div className="col-12 col-lg-4">
          {/* Voucher Box */}
          <div className="card sh-card border-0 p-3 mb-3">
            <h6 className="fw-bold mb-2">Voucher giảm giá</h6>
            <form onSubmit={handleApplyCoupon} className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Nhập: GIAM10, FREESHIP..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                Áp dụng
              </button>
            </form>

            {couponMsg && (
              <div className={`small ${couponMsg.error ? 'text-danger' : 'text-success'} mb-2`}>
                {couponMsg.text}
              </div>
            )}

            {coupon && (
              <div className="bg-success-subtle text-success p-2 rounded-2 small d-flex justify-content-between align-items-center">
                <span>Mã <strong>{coupon.code}</strong> đã kích hoạt</span>
                <button onClick={removeCoupon} className="btn-close btn-close-sm" aria-label="Remove"></button>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="card sh-card border-0 p-3">
            <h6 className="fw-bold border-bottom pb-2 mb-3">Tóm tắt đơn hàng</h6>

            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Tạm tính ({selectedCount} sản phẩm)</span>
              <span className="text-dark fw-semibold">{getSubtotal().toLocaleString('vi-VN')}đ</span>
            </div>

            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Giảm giá</span>
              <span className="text-success fw-semibold">-{getDiscount().toLocaleString('vi-VN')}đ</span>
            </div>

            <div className="d-flex justify-content-between mb-3 small text-muted">
              <span>Phí vận chuyển</span>
              <span className="text-dark fw-semibold">
                {getShippingFee() === 0 ? 'Miễn phí' : `${getShippingFee().toLocaleString('vi-VN')}đ`}
              </span>
            </div>

            <div className="border-top pt-3 d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-dark">Tổng cộng</span>
              <span className="fs-4 fw-bold text-danger">
                {getTotal().toLocaleString('vi-VN')}đ
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={selectedCount === 0}
              className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
