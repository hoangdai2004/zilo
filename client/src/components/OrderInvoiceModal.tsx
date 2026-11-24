import React from 'react';
import { Order } from '../types';

interface OrderInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderInvoiceModal({ order, onClose }: OrderInvoiceModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang chuẩn bị hàng';
      case 'shipped': return 'Đang vận chuyển';
      case 'delivered': return 'Giao thành công';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div className="modal-backdrop fade show no-print" onClick={onClose} style={{ zIndex: 1055 }}></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
          <div className="modal-content shadow-lg border-0 rounded-4">
            {/* Modal Header */}
            <div className="modal-header border-bottom py-3 no-print bg-light">
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-receipt text-primary"></i>
                Chi tiết &amp; Hóa đơn đơn hàng #{order.id}
              </h5>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm px-3" onClick={handlePrint}>
                  <i className="bi bi-printer me-1"></i> In hóa đơn
                </button>
                <button type="button" className="btn-close shadow-none" onClick={onClose} aria-label="Close"></button>
              </div>
            </div>

            {/* Modal Body / Invoice Content */}
            <div className="modal-body p-4 p-md-5" id="print-invoice-area">
              {/* Header Invoice */}
              <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                <div>
                  <div className="d-flex align-items-center gap-2 text-primary fs-3 fw-bold mb-1">
                    <i className="bi bi-bag-check-fill"></i>
                    <span>Zilo Store</span>
                  </div>
                  <p className="text-muted small mb-0">Hệ thống phân phối thiết bị công nghệ chính hãng</p>
                  <p className="text-muted small mb-0">Hotline: 1900 8888 | Email: support@zilo.vn</p>
                  <p className="text-muted small mb-0">Website: https://zilo.vn</p>
                </div>
                <div className="text-end">
                  <h4 className="fw-bolder text-uppercase mb-1 text-dark">HÓA ĐƠN BÁN HÀNG</h4>
                  <div className="text-muted small">Mã đơn: <strong className="text-primary font-monospace">{order.id}</strong></div>
                  <div className="text-muted small">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                  <div className="mt-1">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="row g-3 mb-4 bg-light p-3 rounded-3">
                <div className="col-sm-6">
                  <div className="text-uppercase small fw-bold text-muted mb-1">Khách hàng nhận:</div>
                  <div className="fw-bold text-dark">{order.customerName}</div>
                  <div className="text-muted small">Số điện thoại: <strong>{order.customerPhone}</strong></div>
                  {order.customerEmail && <div className="text-muted small">Email: {order.customerEmail}</div>}
                </div>
                <div className="col-sm-6">
                  <div className="text-uppercase small fw-bold text-muted mb-1">Thông tin giao hàng:</div>
                  <div className="small text-dark mb-1">Địa chỉ: {order.shippingAddress}</div>
                  <div className="small text-muted">
                    Phương thức thanh toán:{' '}
                    <span className="fw-semibold text-uppercase text-dark badge bg-white border">
                      {order.paymentMethod === 'vnpay' ? 'VNPay Sandbox' : order.paymentMethod === 'momo' ? 'Ví MoMo' : 'COD (Khi nhận hàng)'}
                    </span>
                  </div>
                  <div className="small text-muted mt-1">
                    Trạng thái thanh toán:{' '}
                    <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered table-striped align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: '50px' }} className="text-center">STT</th>
                      <th scope="col">Sản phẩm</th>
                      <th scope="col" className="text-center" style={{ width: '100px' }}>Số lượng</th>
                      <th scope="col" className="text-end" style={{ width: '130px' }}>Đơn giá</th>
                      <th scope="col" className="text-end" style={{ width: '140px' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="text-center text-muted small">{index + 1}</td>
                        <td>
                          <div className="fw-semibold text-dark">{item.name}</div>
                          {(item.color || item.storage) && (
                            <small className="text-muted">
                              Phân loại: {[item.color, item.storage].filter(Boolean).join(' / ')}
                            </small>
                          )}
                        </td>
                        <td className="text-center fw-bold">{item.quantity}</td>
                        <td className="text-end text-muted">{item.price.toLocaleString('vi-VN')} ₫</td>
                        <td className="text-end fw-bold text-dark">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary */}
              <div className="row justify-content-end mb-4">
                <div className="col-md-6 col-lg-5">
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Tạm tính tiền hàng:</span>
                    <span className="fw-semibold">{order.subtotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="d-flex justify-content-between py-1 border-bottom small text-success">
                      <span>Giảm giá khuyến mãi:</span>
                      <span>-{order.discount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Phí giao hàng:</span>
                    <span>{order.shippingFee && order.shippingFee > 0 ? `${order.shippingFee.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 mt-1">
                    <span className="fw-bold fs-6 text-dark">Tổng cộng thanh toán:</span>
                    <span className="fw-bolder fs-5 text-danger">{order.total.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-top pt-3 text-center text-muted small">
                <p className="mb-1 fw-semibold text-dark">Cảm ơn quý khách đã mua sắm tại Zilo Store!</p>
                <p className="mb-0" style={{ fontSize: '0.75rem' }}>
                  Quý khách vui lòng kiểm tra kỹ hàng hóa trước khi nhận. Đổi trả miễn phí trong 30 ngày nếu có lỗi từ nhà sản xuất.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer no-print bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
