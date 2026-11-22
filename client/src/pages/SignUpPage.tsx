import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name || !form.email || !form.password) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin!');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Mật khẩu và xác nhận mật khẩu không trùng khớp!');
      return;
    }

    if (form.password.length < 12) {
      setErrorMsg('Mật khẩu cần có ít nhất 12 ký tự.');
      return;
    }

    if (!form.agree) {
      setErrorMsg('Bạn cần đồng ý với Điều khoản dịch vụ!');
      return;
    }

    const success = await register(form.name, form.email, form.password);
    if (success) {
      navigate('/');
    } else {
      setErrorMsg(useAuthStore.getState().error || 'Đăng ký không thành công. Vui lòng thử lại!');
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card sh-card border-0 overflow-hidden shadow-lg" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="row g-0">
          {/* Left Feature Column */}
          <div
            className="col-12 col-md-5 d-none d-md-flex flex-column justify-content-between p-5 text-white"
            style={{
              background: 'linear-gradient(135deg, #0d6efd 0%, #004085 100%)',
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 fs-3 fw-bold mb-4">
                <i className="bi bi-bag-check-fill"></i> ShopHub
              </div>
              <h3 className="fw-bold mb-3">Tạo tài khoản để trải nghiệm mua sắm tốt hơn</h3>
              <p className="opacity-75 small mb-4">
                Tham gia cùng hàng triệu người tiêu dùng thông thái tại ShopHub ngay hôm nay.
              </p>

              {/* Checklist items matching screenshot */}
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-white text-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span>Quản lý đơn hàng dễ dàng</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-white text-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span>Nhận ưu đãi độc quyền</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-white text-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                    <i className="bi bi-check-lg fw-bold"></i>
                  </div>
                  <span>Tích điểm & đổi quà</span>
                </div>
              </div>
            </div>

            <div className="small opacity-75">
              Bảo mật thông tin khách hàng tuyệt đối.
            </div>
          </div>

          {/* Right Form Column */}
          <div className="col-12 col-md-7 p-4 p-lg-5 bg-white">
            <div className="mb-4">
              <h4 className="fw-bold text-dark">Đăng ký tài khoản</h4>
              <p className="text-muted small">Điền thông tin để tạo tài khoản mới</p>
            </div>

            {(errorMsg || authError) && (
              <div className="alert alert-danger py-2 small" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg || authError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Họ và tên */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Họ và tên</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập họ và tên"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Nhập email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              {/* Mật khẩu */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập mật khẩu (tối thiểu 12 ký tự)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={12}
                  required
                />
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  minLength={12}
                  required
                />
              </div>

              {/* Terms checkbox */}
              <div className="form-check mb-4 small">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="agreeTerms"
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                />
                <label className="form-check-label text-muted" htmlFor="agreeTerms">
                  Tôi đồng ý với <Link to="/terms" className="text-primary text-decoration-none">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="text-primary text-decoration-none">Chính sách bảo mật</Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-100 py-2 fw-semibold shadow-sm mb-3"
              >
                {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>

              <div className="text-center small text-muted">
                Đã có tài khoản?{' '}
                <Link to="/sign-in" className="text-primary fw-semibold text-decoration-none">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
