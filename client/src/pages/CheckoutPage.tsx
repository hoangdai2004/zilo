import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const { items, getSubtotal, getDiscount, getShippingFee, getTotal, removeItems } = useCartStore();

  const selectedItems = items.filter((i) => i.selected);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    paymentMethod: 'cod' as 'cod' | 'vnpay' | 'momo',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.addresses.getAll().then((addresses) => {
      const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
      if (active && defaultAddress) {
        setForm((current) => current.address ? current : ({
          ...current,
          name: defaultAddress.recipientName,
          phone: defaultAddress.phone,
          address: [defaultAddress.addressLine, defaultAddress.ward, defaultAddress.district, defaultAddress.city].filter(Boolean).join(', '),
        }));
      }
    }).catch((error: unknown) => {
      if (active) {
        setErrorMessage(error instanceof Error
          ? `Không tải được địa chỉ đã lưu: ${error.message}`
          : 'Không tải được địa chỉ đã lưu. Bạn có thể nhập địa chỉ thủ công.');
      }
    });
    return () => { active = false; };
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!form.name || !form.phone || !form.address) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    try {
      const order = await api.orders.create({
        userId: user?.id || 1,
        customerName: form.name,
        customerPhone: form.phone,
        shippingAddress: form.address,
        paymentMethod: form.paymentMethod,
        items: selectedItems,
        couponCode: useCartStore.getState().coupon?.code,
        note: form.note,
        subtotal: getSubtotal(),
        discount: getDiscount(),
        total: getTotal(),
      });

      removeItems(selectedItems.map((item) => item.id));

      if (order.paymentUrl && form.paymentMethod === 'vnpay') {
        window.location.href = order.paymentUrl;
        return;
      }

      setOrderSuccess(order.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container py-5 text-center">
        <div className="card sh-card border-0 p-5 mx-auto" style={{ maxWidth: '600px' }}>
          <div className="text-success display-1 mb-3">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <h3 className="fw-bold text-dark">Đặt hàng thành công!</h3>
          <p className="text-muted">
            Mã đơn hàng của bạn là <strong className="text-primary">{orderSuccess}</strong>.
            Chúng tôi sẽ liên hệ để xác nhận và giao hàng trong thời gian sớm nhất.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-3">
            <Link to="/" className="btn btn-primary px-4">
              Về trang chủ
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary px-4">
              Xem đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h4>Chưa có sản phẩm nào được chọn để thanh toán!</h4>
        <Link to="/cart" className="btn btn-primary mt-3">Quay lại giỏ hàng</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">Thanh toán đơn hàng</h3>
      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left: Shipping & Payment info */}
          <div className="col-12 col-lg-7">
            {/* Delivery address */}
            <div className="card sh-card border-0 p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-primary"></i> Thông tin giao hàng
              </h5>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Họ và tên người nhận *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="form-control"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Địa chỉ nhận hàng chi tiết *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Ghi chú giao hàng (tuỳ chọn)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Ví dụ: Giao vào giờ hành chính..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card sh-card border-0 p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-credit-card-2-front-fill text-primary"></i> Phương thức thanh toán
              </h5>

              <div className="d-flex flex-column gap-2">
                <label className={`card p-3 border cursor-pointer ${form.paymentMethod === 'cod' ? 'border-primary bg-primary-subtle' : ''}`}>
                  <div className="form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment"
                      checked={form.paymentMethod === 'cod'}
                      onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                    />
                    <div>
                      <div className="fw-semibold">Thanh toán khi nhận hàng (COD)</div>
                      <small className="text-muted">Bạn chỉ thanh toán khi nhận được hàng tận tay.</small>
                    </div>
                  </div>
                </label>

                <label className={`card p-3 border cursor-pointer ${form.paymentMethod === 'vnpay' ? 'border-primary bg-primary-subtle' : ''}`}>
                  <div className="form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment"
                      checked={form.paymentMethod === 'vnpay'}
                      onChange={() => setForm({ ...form, paymentMethod: 'vnpay' })}
                    />
                    <div>
                      <div className="fw-semibold">Cổng thanh toán VNPay (ATM / QR Code / Thẻ ngân hàng)</div>
                      <small className="text-muted">Hỗ trợ cổng thanh toán bảo mật VNPay Sandbox.</small>
                    </div>
                  </div>
                </label>

                <label className={`card p-3 border cursor-pointer ${form.paymentMethod === 'momo' ? 'border-primary bg-primary-subtle' : ''}`}>
                  <div className="form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment"
                      checked={form.paymentMethod === 'momo'}
                      disabled
                    />
                    <div>
                      <div className="fw-semibold">Ví điện tử MoMo</div>
                      <small className="text-muted">Chưa được cấu hình cổng thanh toán.</small>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Products List & Summary */}
          <div className="col-12 col-lg-5">
            <div className="card sh-card border-0 p-4">
              <h5 className="fw-bold border-bottom pb-2 mb-3">Đơn hàng của bạn ({selectedItems.length})</h5>

              <div className="d-flex flex-column gap-3 mb-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {selectedItems.map((item) => (
                  <div key={item.id} className="d-flex align-items-center gap-3">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="rounded border"
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                    <div className="flex-grow-1 text-truncate">
                      <div className="fw-semibold small text-truncate">{item.name}</div>
                      <small className="text-muted">SL: {item.quantity} x {item.price.toLocaleString('vi-VN')}đ</small>
                    </div>
                    <div className="fw-bold text-dark small">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2 small text-muted">
                <span>Tạm tính</span>
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

              <div className="border-top pt-3 d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold fs-6 text-dark">Tổng thanh toán</span>
                <span className="fs-4 fw-bold text-danger">
                  {getTotal().toLocaleString('vi-VN')}đ
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
