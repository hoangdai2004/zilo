import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      setMessage(await api.auth.resetPassword({
        token,
        email: email.trim(),
        password,
        passwordConfirmation,
      }));
      setPassword('');
      setPasswordConfirmation('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card sh-card border-0 shadow-lg p-4 p-md-5" style={{ maxWidth: 520, width: '100%' }}>
        <Link to="/sign-in" className="brand-logo text-primary text-decoration-none fw-bold fs-3 mb-4">
          <i className="bi bi-bag-check-fill me-2"></i>ShopHub
        </Link>
        <h1 className="h4 fw-bold">Tạo mật khẩu mới</h1>
        <p className="text-muted small">Liên kết đặt lại mật khẩu có hiệu lực trong 60 phút và chỉ sử dụng được một lần.</p>

        {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
        {message && (
          <div className="alert alert-success py-2 small" role="status">
            {message} <Link to="/sign-in" className="alert-link">Đăng nhập</Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="reset-email" className="form-label small fw-semibold">Email</label>
            <input
              id="reset-email"
              className="form-control"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="new-password" className="form-label small fw-semibold">Mật khẩu mới</label>
            <input
              id="new-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={255}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="form-text">Ít nhất 12 ký tự.</div>
          </div>
          <div className="mb-4">
            <label htmlFor="confirm-password" className="form-label small fw-semibold">Xác nhận mật khẩu mới</label>
            <input
              id="confirm-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={255}
              required
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting || !email.trim() || !token || !password || !passwordConfirmation || Boolean(message)}
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="text-center small mt-4">
          <Link to="/forgot-password" className="text-decoration-none">Yêu cầu liên kết mới</Link>
        </div>
      </div>
    </div>
  );
}
