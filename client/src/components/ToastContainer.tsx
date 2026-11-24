import React from 'react';
import { useToastStore, ToastItem } from '../store/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  const getIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill text-success';
      case 'error':
        return 'bi-x-circle-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      default:
        return 'bi-info-circle-fill text-primary';
    }
  };

  const getBorderClass = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return 'border-success-subtle bg-white';
      case 'error':
        return 'border-danger-subtle bg-white';
      case 'warning':
        return 'border-warning-subtle bg-white';
      default:
        return 'border-primary-subtle bg-white';
    }
  };

  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 99999, pointerEvents: 'none', maxWidth: '380px', width: '100%' }}
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`toast show border shadow-sm rounded-3 mb-2 p-3 ${getBorderClass(item.type)}`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ pointerEvents: 'auto', transition: 'all 0.25s ease' }}
        >
          <div className="d-flex align-items-start gap-2">
            <i className={`bi ${getIcon(item.type)} fs-5 mt-n1`}></i>
            <div className="flex-grow-1">
              {item.title && <div className="fw-bold small text-dark">{item.title}</div>}
              <div className="small text-muted" style={{ lineHeight: 1.4 }}>{item.message}</div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm ms-auto"
              aria-label="Close"
              onClick={() => removeToast(item.id)}
            ></button>
          </div>
        </div>
      ))}
    </div>
  );
}
