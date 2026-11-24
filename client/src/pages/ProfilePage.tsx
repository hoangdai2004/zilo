import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Address, Coupon, Order, Product } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';
import { toast } from '../store/useToastStore';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import OrderInvoiceModal from '../components/OrderInvoiceModal';

type ProfileTab = 'info' | 'orders' | 'address' | 'vouchers' | 'wishlist' | 'password';

const emptyAddress: Omit<Address, 'id'> = {
  recipientName: '',
  phone: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  isDefault: false,
};

export default function ProfilePage() {
  useDocumentTitle('Tài khoản & Đơn hàng của tôi');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as ProfileTab | null;
  const { user, updateProfile, logout } = useAuthStore();
  const { setWishlist, toggleWishlist } = useProductStore();
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [activeMenu, setActiveMenu] = useState<ProfileTab>(
    requestedTab && ['info', 'orders', 'address', 'vouchers', 'wishlist', 'password'].includes(requestedTab)
      ? requestedTab
      : 'info'
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setFormData({ name: user?.name || '', phone: user?.phone || '' });
  }, [user]);

  useEffect(() => {
    if (requestedTab && ['info', 'orders', 'address', 'vouchers', 'wishlist', 'password'].includes(requestedTab)) {
      setActiveMenu(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    let active = true;
    setErrorMessage('');
    setSuccessMessage('');
    const load = async () => {
      try {
        setLoading(true);
        if (activeMenu === 'orders') {
          setOrders(await api.orders.getAll());
        } else if (activeMenu === 'address') {
          setAddresses(await api.addresses.getAll());
        } else if (activeMenu === 'vouchers') {
          setCoupons(await api.coupons.getAll());
        } else if (activeMenu === 'wishlist') {
          const wishlistData = await api.wishlist.getAll();
          setWishlist(wishlistData.map((product) => product.id));
          if (active) setWishlistProducts(wishlistData);
        }
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu tài khoản.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [activeMenu, setWishlist]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateProfile(formData);
      setSuccessMessage('Cập nhật thông tin thành công.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật thông tin.');
    }
  };

  const handleAddAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const created = await api.addresses.create(addressForm);
      setAddresses((current) => addressForm.isDefault
        ? [...current.map((address) => ({ ...address, isDefault: false })), created]
        : [...current, created]);
      setAddressForm(emptyAddress);
      setShowAddressForm(false);
      setSuccessMessage('Đã thêm địa chỉ giao hàng.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể thêm địa chỉ.');
    }
  };

  const handleSetDefaultAddress = async (address: Address) => {
    try {
      await api.addresses.setDefault(address.id);
      setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === address.id })));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật địa chỉ mặc định.');
    }
  };

  const handleDeleteAddress = async (id: string | number) => {
    try {
      await api.addresses.delete(id);
      setAddresses((current) => current.filter((address) => address.id !== id));
      setSuccessMessage('Đã xóa địa chỉ.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xóa địa chỉ.');
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Hủy đơn hàng ${order.id}?`)) return;
    setErrorMessage('');
    try {
      await api.orders.cancel(order);
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: 'cancelled' } : item));
      setSuccessMessage('Đã hủy đơn hàng.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể hủy đơn hàng.');
    }
  };

  const handlePayVNPay = async (order: Order) => {
    try {
      const url = await api.payment.createVNPayUrl(order.id);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể chuyển đến cổng VNPay.');
    }
  };

  const handleRemoveWishlist = async (product: Product) => {
    setErrorMessage('');
    try {
      await toggleWishlist(product.id);
      setWishlistProducts((current) => current.filter((item) => String(item.id) !== String(product.id)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật danh sách yêu thích.');
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (passwordForm.next.length < 12) {
      setErrorMessage('Mật khẩu mới cần có ít nhất 12 ký tự.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      await api.auth.changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setSuccessMessage('Đổi mật khẩu thành công.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  const navItems: { key: ProfileTab; label: string; icon: string }[] = [
    { key: 'info', label: 'Thông tin cá nhân', icon: 'bi-person' },
    { key: 'orders', label: 'Đơn hàng của tôi', icon: 'bi-box-seam' },
    { key: 'address', label: 'Địa chỉ giao hàng', icon: 'bi-geo-alt' },
    { key: 'vouchers', label: 'Voucher đang áp dụng', icon: 'bi-ticket-perforated' },
    { key: 'wishlist', label: 'Sản phẩm yêu thích', icon: 'bi-heart' },
    { key: 'password', label: 'Đổi mật khẩu', icon: 'bi-lock' },
  ];

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card sh-card border-0 p-3">
            <div className="d-flex align-items-center gap-3 p-2 border-bottom pb-3 mb-2">
              <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: 50, height: 50 }}>
                {user?.name?.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-truncate">
                <h6 className="fw-bold mb-0 text-truncate">{user?.name}</h6>
                <small className="text-muted text-truncate d-block">{user?.email}</small>
              </div>
            </div>
            <div className="d-flex flex-column gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveMenu(item.key);
                    setSearchParams(item.key === 'info' ? {} : { tab: item.key });
                  }}
                  className={`btn btn-sm text-start py-2 px-3 rounded-2 border-0 d-flex align-items-center gap-2 ${activeMenu === item.key ? 'bg-primary text-white fw-semibold' : 'text-dark bg-transparent'}`}
                >
                  <i className={`bi ${item.icon}`}></i>{item.label}
                </button>
              ))}
              <hr className="my-2" />
              <button onClick={handleLogout} className="btn btn-sm text-start py-2 px-3 border-0 text-danger bg-transparent">
                <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8 col-lg-9">
          {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success" role="status">{successMessage}</div>}
          {loading && <div className="text-muted mb-3" role="status">Đang tải dữ liệu...</div>}

          {activeMenu === 'info' && (
            <div className="card sh-card border-0 p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin cá nhân</h5>
              <form onSubmit={handleSaveProfile}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Họ và tên</label>
                    <input className="form-control" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input className="form-control bg-light" disabled value={user?.email || ''} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-control" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
                  </div>
                </div>
                <button className="btn btn-primary mt-4" type="submit">Lưu thay đổi</button>
              </form>
            </div>
          )}

          {activeMenu === 'orders' && (
            <div className="card sh-card border-0 p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Đơn hàng của tôi</h5>
              {orders.length ? (
                <div className="d-flex flex-column gap-3">
                  {orders.map((order) => {
                    const statusConfig: Record<string, { label: string; badge: string; step: number }> = {
                      pending: { label: 'Chờ xử lý', badge: 'bg-warning text-dark', step: 1 },
                      processing: { label: 'Đang chuẩn bị hàng', badge: 'bg-info text-white', step: 2 },
                      shipping: { label: 'Đang vận chuyển', badge: 'bg-primary text-white', step: 3 },
                      delivered: { label: 'Giao thành công', badge: 'bg-success text-white', step: 4 },
                      cancelled: { label: 'Đã hủy', badge: 'bg-danger text-white', step: 0 },
                    };
                    const currentStatus = statusConfig[order.status] || { label: order.status, badge: 'bg-secondary', step: 1 };

                    return (
                      <div className="card border p-3" key={order.id}>
                        <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-2 mb-2">
                          <div>
                            <span className="text-muted small">Mã đơn:</span>{' '}
                            <strong className="text-primary">{order.id}</strong>{' '}
                            <span className="text-muted small ms-2">({new Date(order.createdAt).toLocaleDateString('vi-VN')})</span>
                          </div>
                          <div>
                            <span className={`badge px-2 py-1 ${currentStatus.badge}`}>{currentStatus.label}</span>
                          </div>
                        </div>

                        {/* Order Timeline */}
                        {order.status !== 'cancelled' && (
                          <div className="py-2 mb-2">
                            <div className="position-relative m-2">
                              <div className="progress" style={{ height: '4px' }}>
                                <div
                                  className="progress-bar bg-success"
                                  role="progressbar"
                                  style={{ width: `${((currentStatus.step - 1) / 3) * 100}%` }}
                                ></div>
                              </div>
                              <div className="d-flex justify-content-between position-relative" style={{ marginTop: '-14px' }}>
                                {['Đặt hàng', 'Chuẩn bị', 'Đang giao', 'Đã nhận'].map((label, index) => {
                                  const isCompleted = currentStatus.step >= index + 1;
                                  return (
                                    <div key={label} className="text-center" style={{ width: '60px' }}>
                                      <div
                                        className={`rounded-circle mx-auto d-flex align-items-center justify-content-center text-white ${
                                          isCompleted ? 'bg-success' : 'bg-secondary-subtle text-muted border'
                                        }`}
                                        style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
                                      >
                                        {isCompleted ? '✓' : index + 1}
                                      </div>
                                      <span className="small text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                                        {label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="d-flex flex-column gap-2 my-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center small">
                              <div>
                                <span className="fw-medium text-dark">{item.name}</span>
                                {item.color && <span className="text-muted ms-2">Màu: {item.color}</span>}
                                {item.storage && <span className="text-muted ms-1">({item.storage})</span>}
                                <span className="text-muted ms-2">x{item.quantity}</span>
                              </div>
                              <span className="fw-semibold text-danger">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                            </div>
                          ))}
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-1">
                          <span className="small text-muted">
                            PTTT: <strong className="text-uppercase text-dark">{order.paymentMethod}</strong>
                          </span>
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              <span className="small text-muted me-1">Tổng tiền:</span>
                              <strong className="text-danger fs-6">{order.total.toLocaleString('vi-VN')}đ</strong>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setSelectedInvoiceOrder(order)}
                            >
                              <i className="bi bi-printer me-1"></i> Hóa đơn
                            </button>
                            {order.paymentMethod === 'vnpay' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                              <button className="btn btn-sm btn-primary" onClick={() => void handlePayVNPay(order)}>
                                <i className="bi bi-credit-card me-1"></i> Thanh toán VNPay
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => void handleCancelOrder(order)}>
                                Hủy đơn
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !loading && <p className="text-muted mb-0">Bạn chưa có đơn hàng nào.</p>}
            </div>
          )}

          {activeMenu === 'address' && (
            <div className="card sh-card border-0 p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="fw-bold mb-0">Sổ địa chỉ</h5>
                <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAddressForm((show) => !show)}>
                  {showAddressForm ? 'Đóng' : '+ Thêm địa chỉ'}
                </button>
              </div>
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="row g-3 mb-4">
                  {([
                    ['recipientName', 'Tên người nhận'],
                    ['phone', 'Số điện thoại'],
                    ['addressLine', 'Địa chỉ chi tiết'],
                    ['ward', 'Phường/Xã'],
                    ['district', 'Quận/Huyện'],
                    ['city', 'Tỉnh/Thành phố'],
                  ] as const).map(([field, label]) => (
                    <div className="col-md-6" key={field}>
                      <label className="form-label">{label}</label>
                      <input className="form-control" required value={addressForm[field]} onChange={(event) => setAddressForm({ ...addressForm, [field]: event.target.value })} />
                    </div>
                  ))}
                  <div className="col-12 form-check ms-2">
                    <input className="form-check-input" type="checkbox" checked={addressForm.isDefault} id="defaultAddress" onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} />
                    <label className="form-check-label" htmlFor="defaultAddress">Đặt làm địa chỉ mặc định</label>
                  </div>
                  <div className="col-12"><button className="btn btn-primary btn-sm" type="submit">Lưu địa chỉ</button></div>
                </form>
              )}
              {addresses.map((address) => (
                <div className="card p-3 mb-3" key={address.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{address.recipientName} · {address.phone}</strong>
                      <p className="text-muted small mb-0">{address.addressLine}, {address.ward}, {address.district}, {address.city}</p>
                    </div>
                    <div className="d-flex gap-2">
                      {address.isDefault
                        ? <span className="badge bg-primary">Mặc định</span>
                        : <button className="btn btn-link btn-sm p-0" onClick={() => void handleSetDefaultAddress(address)}>Đặt mặc định</button>}
                      <button className="btn btn-link btn-sm text-danger p-0" onClick={() => void handleDeleteAddress(address.id)}>Xóa</button>
                    </div>
                  </div>
                </div>
              ))}
              {!addresses.length && !loading && <p className="text-muted mb-0">Chưa có địa chỉ giao hàng.</p>}
            </div>
          )}

          {activeMenu === 'vouchers' && (
            <div className="card sh-card border-0 p-4">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Voucher đang áp dụng</h5>
              {coupons.length ? <div className="row g-3">{coupons.map((coupon) => (
                <div className="col-md-6" key={coupon.code}>
                  <div className="card p-3 bg-light">
                    <strong className="text-primary fs-5">{coupon.code}</strong>
                    <span>{coupon.discountType === 'percentage' ? `Giảm ${coupon.discountValue}%` : `Giảm ${coupon.discountValue.toLocaleString('vi-VN')}đ`}</span>
                    <small className="text-muted">Đơn tối thiểu {coupon.minOrderValue.toLocaleString('vi-VN')}đ</small>
                  </div>
                </div>
              ))}</div> : !loading && <p className="text-muted mb-0">Hiện chưa có voucher khả dụng.</p>}
            </div>
          )}

          {activeMenu === 'wishlist' && (
            <div className="card sh-card border-0 p-4">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Sản phẩm yêu thích</h5>
              {wishlistProducts.length ? <div className="list-group">{wishlistProducts.map((product) => (
                <div className="list-group-item d-flex align-items-center gap-3" key={product.id}>
                  <img src={product.thumbnail} alt="" width="56" height="56" className="object-fit-contain" />
                  <Link className="flex-grow-1 text-decoration-none" to={`/products/${product.id}`}>{product.name}</Link>
                  <span>{product.price.toLocaleString('vi-VN')}đ</span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => void handleRemoveWishlist(product)}>Bỏ thích</button>
                </div>
              ))}</div> : !loading && <p className="text-muted mb-0">Danh sách yêu thích đang trống.</p>}
            </div>
          )}

          {activeMenu === 'password' && (
            <div className="card sh-card border-0 p-4" style={{ maxWidth: 520 }}>
              <h5 className="fw-bold mb-3 border-bottom pb-2">Đổi mật khẩu</h5>
              <form onSubmit={handleChangePassword}>
                <div className="mb-3"><label className="form-label">Mật khẩu hiện tại</label><input className="form-control" type="password" required value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label">Mật khẩu mới</label><input className="form-control" type="password" minLength={12} required value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} /></div>
                <div className="mb-4"><label className="form-label">Nhập lại mật khẩu mới</label><input className="form-control" type="password" minLength={12} required value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} /></div>
                <button className="btn btn-primary" type="submit">Cập nhật mật khẩu</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Printable Modal */}
      <OrderInvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
    </div>
  );
}
