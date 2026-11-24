import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface VNPayResult {
  isValid: boolean;
  isSuccess: boolean;
  responseCode: string;
  orderNumber?: string;
  amount?: number;
  transactionNo?: string;
  bankCode?: string;
  payDate?: string;
  message?: string;
}

export default function VNPayReturnPage() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VNPayResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!location.search) {
      setErrorMessage('Không tìm thấy tham số kết quả thanh toán từ VNPay.');
      setLoading(false);
      return;
    }

    api.payment.verifyVNPayReturn(location.search)
      .then((res: any) => {
        if (!active) return;
        const resData = res.data || {};
        setResult({
          isValid: Boolean(resData.isValid),
          isSuccess: Boolean(resData.isSuccess),
          responseCode: resData.responseCode || '',
          orderNumber: resData.orderNumber || '',
          amount: Number(resData.amount || 0),
          transactionNo: resData.transactionNo || '',
          bankCode: resData.bankCode || '',
          payDate: resData.payDate || '',
          message: res.message || '',
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi xác thực kết quả thanh toán với hệ thống.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.search]);

  const handleRetryPayment = async () => {
    if (!result?.orderNumber) return;
    setRetryLoading(true);
    try {
      const url = await api.payment.createVNPayUrl(result.orderNumber);
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể khởi tạo lại giao dịch VNPay.');
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="card sh-card border-0 p-5 mx-auto" style={{ maxWidth: '540px' }}>
          <div className="spinner-border text-primary mx-auto mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <h4 className="fw-bold mb-2">Đang xác thực giao dịch</h4>
          <p className="text-muted mb-0">Hệ thống đang kiểm tra kết quả giao dịch từ cổng VNPay, vui lòng không tắt trình duyệt...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container py-5 text-center">
        <div className="card sh-card border-0 p-5 mx-auto" style={{ maxWidth: '540px' }}>
          <div className="text-danger display-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <h4 className="fw-bold text-danger mb-2">Xác thực thất bại</h4>
          <p className="text-muted mb-4">{errorMessage}</p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/" className="btn btn-outline-secondary px-4">Về trang chủ</Link>
            <Link to="/profile" className="btn btn-primary px-4">Xem đơn hàng</Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.isSuccess;

  return (
    <div className="container py-5">
      <div className="card sh-card border-0 p-4 p-md-5 mx-auto shadow-sm" style={{ maxWidth: '620px' }}>
        <div className="text-center mb-4">
          {isSuccess ? (
            <>
              <div className="text-success display-2 mb-3">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h3 className="fw-bold text-success mb-1">Thanh toán thành công!</h3>
              <p className="text-muted">Đơn hàng của bạn đã được xác nhận thanh toán trực tuyến qua VNPay.</p>
            </>
          ) : (
            <>
              <div className="text-warning display-2 mb-3">
                <i className="bi bi-exclamation-circle-fill"></i>
              </div>
              <h3 className="fw-bold text-warning mb-1">Thanh toán chưa hoàn tất</h3>
              <p className="text-muted">
                {result?.message || 'Giao dịch không thành công hoặc bạn đã hủy thao tác thanh toán.'}
              </p>
            </>
          )}
        </div>

        {/* Thông tin chi tiết */}
        <div className="bg-light p-3 rounded mb-4">
          <div className="d-flex justify-content-between py-2 border-bottom">
            <span className="text-muted">Mã đơn hàng:</span>
            <strong className="text-dark">{result?.orderNumber || '---'}</strong>
          </div>
          {result?.amount ? (
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Số tiền đã thanh toán:</span>
              <strong className="text-primary">{result.amount.toLocaleString('vi-VN')} ₫</strong>
            </div>
          ) : null}
          <div className="d-flex justify-content-between py-2 border-bottom">
            <span className="text-muted">Phương thức:</span>
            <span className="fw-semibold">VNPay Sandbox</span>
          </div>
          {result?.transactionNo ? (
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Mã giao dịch VNPay:</span>
              <span className="text-dark font-monospace">{result.transactionNo}</span>
            </div>
          ) : null}
          {result?.bankCode ? (
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Ngân hàng thanh toán:</span>
              <span className="badge bg-secondary-subtle text-secondary-emphasis">{result.bankCode}</span>
            </div>
          ) : null}
          <div className="d-flex justify-content-between py-2">
            <span className="text-muted">Trạng thái:</span>
            <span className={`badge ${isSuccess ? 'bg-success' : 'bg-warning text-dark'}`}>
              {isSuccess ? 'Đã thanh toán (Paid)' : 'Chưa thanh toán'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-2">
          {isSuccess ? (
            <>
              <Link to="/profile" className="btn btn-primary px-4">
                <i className="bi bi-receipt me-1"></i> Xem đơn hàng của tôi
              </Link>
              <Link to="/products" className="btn btn-outline-secondary px-4">
                Tiếp tục mua hàng
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={handleRetryPayment}
                disabled={retryLoading}
              >
                {retryLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Đang chuyển hướng...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i> Thử thanh toán lại qua VNPay
                  </>
                )}
              </button>
              <Link to="/profile" className="btn btn-outline-secondary px-4">
                Về danh sách đơn hàng
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
