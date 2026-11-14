import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error: authError } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.email || !form.password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }

    const success = await login(form.email, form.password);
    if (success) {
      const returnLocation = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
      const authenticatedUser = useAuthStore.getState().user;
      const returnTo = returnLocation
        ? `${returnLocation.pathname || '/'}${returnLocation.search || ''}`
        : authenticatedUser?.role === 'admin' ? '/admin' : '/';
      navigate(returnTo, { replace: true });
    } else {
      setErrorMsg(useAuthStore.getState().error || 'Đăng nhập không thành công. Vui lòng thử lại!');
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card sh-card border-0 overflow-hidden shadow-lg" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="row g-0">
          {/* Left Decorative Banner (Khớp thiết kế) */}
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
              <h3 className="fw-bold mb-2">Chào mừng trở lại!</h3>
              <p className="opacity-75 small">
                Đăng nhập để tiếp tục trải nghiệm mua sắm tiện ích và nhận ngập tràn ưu đãi từ ShopHub.
              </p>
            </div>

            <div className="text-center my-4">
              <i className="bi bi-cart4 display-1 opacity-50"></i>
            </div>

            <div className="small opacity-75">
              Hệ thống mua sắm trực tuyến chính hãng & tin cậy số 1.
            </div>
          </div>

          {/* Right Form Card */}
          <div className="col-12 col-md-7 p-4 p-lg-5 bg-white">
            <div className="mb-4">
              <h4 className="fw-bold text-dark">Đăng nhập</h4>
              <p className="text-muted small">Nhập thông tin tài khoản của bạn để tiếp tục</p>
            </div>

            {(errorMsg || authError) && (
              <div className="alert alert-danger py-2 small" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg || authError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <label className="form-label small fw-semibold text-muted">Mật khẩu</label>
                  <Link to="/forgot-password" className="small text-primary text-decoration-none mb-2">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !form.email.trim() || !form.password}
                className="btn btn-primary w-100 py-2 fw-semibold shadow-sm mb-4"
              >
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>

              <div className="text-center small text-muted">
                Chưa có tài khoản?{' '}
                <Link to="/sign-up" className="text-primary fw-semibold text-decoration-none">
                  Đăng ký ngay
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
