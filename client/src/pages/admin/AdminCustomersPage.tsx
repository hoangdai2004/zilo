import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  orders_count: number;
  total_spent: number | string | null;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.admin.getCustomers(page, submittedSearch);
      setCustomers(result.items);
      setLastPage(result.lastPage);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [page, submittedSearch]);

  useEffect(() => { void loadCustomers(); }, [loadCustomers]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Khách hàng</h4>
        <span className="text-muted small">{total} tài khoản</span>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="card sh-card border-0 p-3">
        <form onSubmit={submitSearch} className="input-group mb-3" style={{ maxWidth: 520 }}>
          <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email hoặc số điện thoại" />
          <button className="btn btn-outline-primary" type="submit">Tìm</button>
        </form>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Đơn hàng</th><th>Tổng đã mua</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>}
              {!loading && customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}<div className="small text-muted">{customer.email}</div></td>
                  <td>{customer.phone || '—'}</td>
                  <td>{customer.orders_count}</td>
                  <td>{Number(customer.total_spent || 0).toLocaleString('vi-VN')}đ</td>
                  <td><span className={`badge ${customer.is_active ? 'bg-success' : 'bg-secondary'}`}>{customer.is_active ? 'Hoạt động' : 'Đã khóa'}</span></td>
                  <td>{new Date(customer.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
              {!loading && customers.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Không tìm thấy khách hàng.</td></tr>}
            </tbody>
          </table>
        </div>
        {lastPage > 1 && <div className="d-flex justify-content-end align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Trước</button>
          <span className="small text-muted">Trang {page}/{lastPage}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= lastPage || loading} onClick={() => setPage((current) => current + 1)}>Sau</button>
        </div>}
      </div>
    </div>
  );
}
