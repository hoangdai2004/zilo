import React, { useCallback, useEffect, useState } from 'react';
import { Coupon } from '../../types';
import { api } from '../../services/api';

const blankCoupon: Coupon = {
  code: '',
  discountType: 'fixed',
  discountValue: 0,
  minOrderValue: 0,
  maxUses: null,
  isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<Coupon>(blankCoupon);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await api.coupons.getAllForAdmin());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCoupons(); }, [loadCoupons]);

  const resetForm = () => {
    setEditing(null);
    setForm(blankCoupon);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editing?.id !== undefined) {
        const updated = await api.coupons.update(editing.id, form);
        setCoupons((current) => current.map((coupon) => String(coupon.id) === String(updated.id) ? updated : coupon));
      } else {
        const created = await api.coupons.create({ ...form, code: form.code.trim().toUpperCase() });
        setCoupons((current) => [created, ...current]);
      }
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể lưu mã giảm giá.');
    }
  };

  const remove = async (coupon: Coupon) => {
    if (coupon.id === undefined || !window.confirm(`Xóa mã "${coupon.code}"?`)) return;
    setError('');
    try {
      await api.coupons.delete(coupon.id);
      setCoupons((current) => current.filter((entry) => entry.id !== coupon.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xóa mã giảm giá.');
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-4">Quản lý mã giảm giá</h4>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-4">
        <div className="col-lg-4">
          <form className="card sh-card border-0 p-3" onSubmit={submit}>
            <h6 className="fw-bold">{editing ? 'Cập nhật mã' : 'Tạo mã mới'}</h6>
            <label className="form-label small">Mã</label>
            <input className="form-control mb-3" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
            <label className="form-label small">Loại giảm giá</label>
            <select className="form-select mb-3" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value as Coupon['discountType'] })}>
              <option value="fixed">Số tiền cố định</option>
              <option value="percentage">Phần trăm</option>
            </select>
            <label className="form-label small">Giá trị giảm</label>
            <input className="form-control mb-3" type="number" min="0.01" step="0.01" required value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} />
            <label className="form-label small">Đơn hàng tối thiểu</label>
            <input className="form-control mb-3" type="number" min="0" step="1" value={form.minOrderValue} onChange={(event) => setForm({ ...form, minOrderValue: Number(event.target.value) })} />
            <label className="form-label small">Số lượt sử dụng tối đa (để trống = không giới hạn)</label>
            <input className="form-control mb-3" type="number" min="1" value={form.maxUses ?? ''} onChange={(event) => setForm({ ...form, maxUses: event.target.value ? Number(event.target.value) : null })} />
            <div className="form-check mb-3">
              <input className="form-check-input" id="couponActive" type="checkbox" checked={form.isActive ?? true} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              <label className="form-check-label" htmlFor="couponActive">Đang hoạt động</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit">{editing ? 'Lưu thay đổi' : 'Tạo mã'}</button>
              {editing && <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>Hủy</button>}
            </div>
          </form>
        </div>
        <div className="col-lg-8">
          <div className="card sh-card border-0 p-3 table-responsive">
            {loading ? <p className="text-muted mb-0">Đang tải...</p> : (
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>Mã</th><th>Ưu đãi</th><th>Đã dùng</th><th>Đơn tối thiểu</th><th>Trạng thái</th><th className="text-end">Thao tác</th></tr></thead>
                <tbody>{coupons.map((coupon) => (
                  <tr key={coupon.id || coupon.code}>
                    <td className="fw-bold text-primary">{coupon.code}</td>
                    <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`}</td>
                    <td>{coupon.usedCount ?? 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td>
                    <td>{coupon.minOrderValue.toLocaleString('vi-VN')}đ</td>
                    <td><span className={`badge ${coupon.isActive ? 'bg-success' : 'bg-secondary'}`}>{coupon.isActive ? 'Hoạt động' : 'Đã tắt'}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => {
                        setEditing(coupon);
                        setForm(coupon);
                      }}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => void remove(coupon)}>Xóa</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {!loading && !coupons.length && <p className="text-muted text-center my-3">Chưa có mã giảm giá đang hoạt động.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
