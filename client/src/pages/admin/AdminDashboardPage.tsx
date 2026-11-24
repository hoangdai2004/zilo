import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Order, Product } from '../../types';
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

const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.getDashboard().then(setData).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải tổng quan.');
    });

    // Tải danh sách sản phẩm để phát hiện hàng sắp hết (< 5)
    api.products.getAllForAdmin().then((products) => {
      const lowStock = products.filter((p) => p.stock < 5);
      setLowStockProducts(lowStock);
    }).catch(() => {
      // Bỏ qua nếu lỗi tải phụ
    });
  }, []);

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (!data) return <div className="text-center py-5 text-muted" role="status">Đang tải tổng quan...</div>;

  const stats = [
    { label: 'Doanh số thực tế', value: money(data.revenue), note: `30 ngày gần đây: ${money(data.last30DaysRevenue)}`, icon: 'bi-currency-dollar', color: 'primary' },
    { label: 'Đơn hàng', value: data.ordersCount.toLocaleString('vi-VN'), note: `${data.pendingOrdersCount} đơn chờ xử lý`, icon: 'bi-bag-check', color: 'warning' },
    { label: 'Khách hàng', value: data.customersCount.toLocaleString('vi-VN'), note: 'Tài khoản khách hàng', icon: 'bi-people', color: 'success' },
    { label: 'Sản phẩm', value: data.productsCount.toLocaleString('vi-VN'), note: `${data.activeProductsCount} sản phẩm đang mở bán`, icon: 'bi-box-seam', color: 'info' },
  ];

  return (
    <div>
      <h4 className="fw-bold mb-4">Tổng quan cửa hàng Zilo</h4>

      {/* 4 Thẻ thống kê */}
      <div className="row g-3 mb-4">
        {stats.map((stat) => (
          <div className="col-12 col-sm-6 col-xl-3" key={stat.label}>
            <div className="card sh-card border-0 h-100 p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small">{stat.label}</div>
                  <div className="fs-4 fw-bold mt-2 text-dark">{stat.value}</div>
                </div>
                <span className={`text-${stat.color} fs-2`}><i className={`bi ${stat.icon}`} /></span>
              </div>
              <small className="text-muted mt-2 d-block">{stat.note}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Cảnh báo tồn kho thấp (< 5 sản phẩm) */}
      <section className="card sh-card border-0 p-3 mb-4 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger fs-6 p-2"><i className="bi bi-exclamation-triangle-fill"></i></span>
            <div>
              <h5 className="fw-bold mb-0 text-danger">Cảnh báo tồn kho thấp (&lt; 5 sản phẩm)</h5>
              <small className="text-muted">Cần nhập thêm hàng để tránh gián đoạn kinh doanh</small>
            </div>
          </div>
          <Link className="btn btn-sm btn-outline-danger" to="/admin/products">
            <i className="bi bi-pencil-square me-1"></i> Quản lý kho hàng
          </Link>
        </div>

        {lowStockProducts.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Đơn giá</th>
                  <th className="text-center">Số lượng tồn</th>
                  <th className="text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="rounded border object-fit-cover"
                          style={{ width: '40px', height: '40px' }}
                        />
                        <span className="fw-semibold text-dark">{product.name}</span>
                      </div>
                    </td>
                    <td>{product.categoryName || '---'}</td>
                    <td>{money(product.price)}</td>
                    <td className="text-center">
                      <span className={`badge ${product.stock === 0 ? 'bg-danger' : 'bg-warning text-dark'} px-2 py-1`}>
                        {product.stock === 0 ? 'Hết hàng (0)' : `Sắp hết (${product.stock})`}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link to="/admin/products" className="btn btn-sm btn-outline-primary">
                        Nhập thêm
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-3 text-success">
            <i className="bi bi-check-circle-fill fs-4 me-2"></i>
            Tất cả sản phẩm hiện đều còn đủ số lượng tồn kho an toàn (&gt;= 5).
          </div>
        )}
      </section>

      {/* Đơn hàng mới nhất */}
      <section className="card sh-card border-0 p-3 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <h5 className="fw-bold mb-0">Đơn hàng mới nhất</h5>
          <Link className="btn btn-sm btn-outline-primary" to="/admin/orders">
            Xem tất cả đơn hàng →
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th className="text-end">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.resourceId || order.id}>
                  <td className="fw-semibold text-primary">{order.id}</td>
                  <td>
                    <div className="fw-medium text-dark">{order.customerName}</div>
                    <div className="small text-muted">{order.customerEmail || order.customerPhone}</div>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className="badge bg-secondary-subtle text-secondary-emphasis border">
                      {order.status}
                    </span>
                  </td>
                  <td className="text-end fw-bold text-danger">{money(order.total)}</td>
                </tr>
              ))}
              {!data.recentOrders.length && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Chưa có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
