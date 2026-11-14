import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../types';
import { api } from '../../services/api';

interface DashboardData {
  productsCount: number;
  activeProductsCount: number;
  customersCount: number;
  ordersCount: number;
  pendingOrdersCount: number;
  revenue: number;
  last30DaysRevenue: number;
  recentOrders: Order[];
}

const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.getDashboard().then(setData).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải tổng quan.');
    });
  }, []);

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (!data) return <div className="text-center py-5 text-muted" role="status">Đang tải tổng quan...</div>;

  const stats = [
    { label: 'Doanh số đơn không hủy', value: money(data.revenue), note: `30 ngày gần đây: ${money(data.last30DaysRevenue)}`, icon: 'bi-currency-dollar', color: 'primary' },
    { label: 'Đơn hàng', value: data.ordersCount.toLocaleString('vi-VN'), note: `${data.pendingOrdersCount} đơn chờ xử lý`, icon: 'bi-bag', color: 'warning' },
    { label: 'Khách hàng', value: data.customersCount.toLocaleString('vi-VN'), note: 'Tài khoản khách hàng', icon: 'bi-people', color: 'success' },
    { label: 'Sản phẩm', value: data.productsCount.toLocaleString('vi-VN'), note: `${data.activeProductsCount} sản phẩm đang bán`, icon: 'bi-box-seam', color: 'info' },
  ];

  return (
    <div>
      <h4 className="fw-bold mb-4">Tổng quan cửa hàng</h4>
      <div className="row g-3 mb-4">
        {stats.map((stat) => (
          <div className="col-12 col-sm-6 col-xl-3" key={stat.label}>
            <div className="card sh-card border-0 h-100 p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small">{stat.label}</div>
                  <div className="fs-4 fw-bold mt-2">{stat.value}</div>
                </div>
                <span className={`text-${stat.color} fs-3`}><i className={`bi ${stat.icon}`} /></span>
              </div>
              <small className="text-muted mt-2">{stat.note}</small>
            </div>
          </div>
        ))}
      </div>

      <section className="card sh-card border-0 p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">Đơn hàng mới nhất</h5>
          <Link className="btn btn-sm btn-outline-primary" to="/admin/orders">Quản lý đơn hàng</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Trạng thái</th><th className="text-end">Tổng tiền</th></tr></thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.resourceId || order.id}>
                  <td className="fw-semibold">{order.id}</td>
                  <td>{order.customerName}<div className="small text-muted">{order.customerEmail}</div></td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{order.status}</td>
                  <td className="text-end fw-semibold">{money(order.total)}</td>
                </tr>
              ))}
              {!data.recentOrders.length && <tr><td colSpan={5} className="text-center text-muted py-4">Chưa có đơn hàng.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
