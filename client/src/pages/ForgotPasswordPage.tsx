import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      setMessage(await api.auth.sendPasswordResetLink(email.trim()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi yêu cầu đặt lại mật khẩu.');
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
        <h1 className="h4 fw-bold">Quên mật khẩu?</h1>
        <p className="text-muted small">Nhập email tài khoản. Nếu email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>

        {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
        {message && <div className="alert alert-success py-2 small" role="status">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="reset-email" className="form-label small fw-semibold">Email</label>
          <input
            id="reset-email"
            className="form-control mb-3"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting || !email.trim()}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
          </button>
        </form>

        <div className="text-center small mt-4">
          <Link to="/sign-in" className="text-decoration-none"><i className="bi bi-arrow-left me-1"></i>Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
