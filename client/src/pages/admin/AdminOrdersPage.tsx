import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Order } from '../../types';
import { api } from '../../services/api';
import OrderInvoiceModal from '../../components/OrderInvoiceModal';

const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusLabels: Record<Order['status'], string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang chuẩn bị',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
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
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

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

  // Xuất file CSV (tương thích Excel tiếng Việt UTF-8 có BOM)
  const handleExportCSV = () => {
    if (!orders.length) {
      alert('Không có dữ liệu đơn hàng để xuất.');
      return;
    }

    const headers = [
      'Mã đơn hàng',
      'Khách hàng',
      'Số điện thoại',
      'Email',
      'Địa chỉ giao hàng',
      'Phương thức thanh toán',
      'Trạng thái thanh toán',
      'Trạng thái đơn hàng',
      'Tổng tiền (VNĐ)',
      'Ngày đặt',
    ];

    const rows = orders.map((o) => [
      `"${o.id}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.customerEmail || ''}"`,
      `"${(o.shippingAddress || '').replace(/"/g, '""')}"`,
      `"${o.paymentMethod.toUpperCase()}"`,
      `"${o.paymentStatus || 'pending'}"`,
      `"${statusLabels[o.status] || o.status}"`,
      o.total,
      `"${new Date(o.createdAt).toLocaleString('vi-VN')}"`,
    ]);

    // Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị tiếng Việt có dấu chuẩn xác
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zilo_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="fw-bold mb-0">Quản lý đơn hàng</h4>
          <span className="text-muted small">Tổng cộng: {total} đơn hàng</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-success btn-sm px-3" onClick={handleExportCSV}>
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Xuất Excel (CSV)
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="card sh-card border-0 p-3 shadow-sm">
        <div className="d-flex flex-column flex-md-row gap-2 mb-3">
          <form onSubmit={submitSearch} className="input-group">
            <input
              className="form-control"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã đơn, tên hoặc số điện thoại..."
            />
            <button className="btn btn-outline-primary" type="submit">
              <i className="bi bi-search me-1"></i> Tìm
            </button>
          </form>
          <select
            className="form-select"
            style={{ maxWidth: 220 }}
            value={statusFilter}
            onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }}
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Ngày đặt</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-4">Đang tải đơn hàng...</td></tr>}
              {!loading && orders.map((order) => (
                <tr key={order.resourceId || order.id}>
                  <td className="fw-semibold text-primary">{order.id}</td>
                  <td>
                    <div className="fw-medium text-dark">{order.customerName}</div>
                    <div className="small text-muted">{order.customerPhone}</div>
                    <div className="small text-muted">{order.customerEmail}</div>
                  </td>
                  <td>{order.items.length} mặt hàng</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {order.paymentMethod.toUpperCase()}
                    </span>
                    <div className="small text-muted mt-1">
                      {order.paymentStatus === 'paid' ? (
                        <span className="text-success fw-semibold">Đã thanh toán</span>
                      ) : (
                        <span className="text-warning fw-semibold">Chưa thanh toán</span>
                      )}
                    </div>
                  </td>
                  <td className="fw-bold text-danger">{order.total.toLocaleString('vi-VN')} ₫</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={order.status}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      onChange={(event) => void updateStatus(order, event.target.value as Order['status'])}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      title="Xem & In hóa đơn"
                      onClick={() => setSelectedInvoiceOrder(order)}
                    >
                      <i className="bi bi-printer me-1"></i> In hóa đơn
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !orders.length && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">Không tìm thấy đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {lastPage > 1 && (
          <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
            <span className="small text-muted">Trang {page} / {lastPage}</span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <OrderInvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
    </div>
  );
}
