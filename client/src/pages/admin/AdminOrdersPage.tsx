import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Order } from '../../types';
import { api } from '../../services/api';

const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusLabels: Record<Order['status'], string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang chuẩn bị',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};
const transitions: Record<Order['status'], Order['status'][]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.admin.getOrders(page, submittedSearch, statusFilter);
      setOrders(result.items);
      setLastPage(result.lastPage);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [page, submittedSearch, statusFilter]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };

  const updateStatus = async (order: Order, status: Order['status']) => {
    if (order.resourceId === undefined) return;
    setError('');
    try {
      const updated = await api.admin.updateOrderStatus(order.resourceId, status);
      setOrders((current) => current.map((entry) => entry.resourceId === updated.resourceId ? updated : entry));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Quản lý đơn hàng</h4>
        <span className="text-muted small">{total} đơn hàng</span>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="card sh-card border-0 p-3">
        <div className="d-flex flex-column flex-md-row gap-2 mb-3">
          <form onSubmit={submitSearch} className="input-group">
            <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, tên hoặc điện thoại" />
            <button className="btn btn-outline-primary" type="submit">Tìm</button>
          </form>
          <select className="form-select" style={{ maxWidth: 220 }} value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }}>
            <option value="">Tất cả trạng thái</option>
            {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Ngày đặt</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4">Đang tải...</td></tr>}
              {!loading && orders.map((order) => (
                <tr key={order.resourceId || order.id}>
                  <td className="fw-semibold">{order.id}</td>
                  <td>{order.customerName}<div className="small text-muted">{order.customerPhone}</div><div className="small text-muted">{order.customerEmail}</div></td>
                  <td>{order.items.length} mặt hàng</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{order.paymentMethod.toUpperCase()}<div className="small text-muted">{order.paymentStatus || 'pending'}</div></td>
                  <td>{order.total.toLocaleString('vi-VN')}đ</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={order.status}
                      disabled={!transitions[order.status].length}
                      onChange={(event) => void updateStatus(order, event.target.value as Order['status'])}
                    >
                      <option value={order.status}>{statusLabels[order.status]}</option>
                      {transitions[order.status].map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Không có đơn hàng phù hợp.</td></tr>}
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
