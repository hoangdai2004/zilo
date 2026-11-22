import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Brand } from '../../types';
import { api } from '../../services/api';

const emptyForm = { name: '', description: '', logo: '', isActive: true };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      setBrands(await api.brands.getAllForAdmin());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải thương hiệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBrands(); }, [loadBrands]);

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.brands.update(editing.id, form);
        setBrands((current) => current.map((brand) => brand.id === updated.id ? updated : brand));
      } else {
        const created = await api.brands.create(form);
        setBrands((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể lưu thương hiệu.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (brand: Brand) => {
    if (!window.confirm(`Xóa thương hiệu "${brand.name}"?`)) return;
    setError('');
    try {
      await api.brands.delete(brand.id);
      setBrands((current) => current.filter((entry) => entry.id !== brand.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xóa thương hiệu.');
    }
  };

  const edit = (brand: Brand) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      description: brand.description || '',
      logo: brand.logo || '',
      isActive: brand.isActive,
    });
  };

  return (
    <div>
      <h4 className="fw-bold mb-4">Quản lý thương hiệu</h4>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-4">
        <div className="col-lg-4">
          <form className="card sh-card border-0 p-3" onSubmit={submit}>
            <h6 className="fw-bold">{editing ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu'}</h6>
            <label className="form-label small">Tên thương hiệu</label>
            <input className="form-control mb-3" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <label className="form-label small">Mô tả</label>
            <textarea className="form-control mb-3" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <label className="form-label small">URL logo</label>
            <input className="form-control mb-3" type="url" value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} />
            <div className="form-check mb-3">
              <input className="form-check-input" id="brandActive" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              <label className="form-check-label" htmlFor="brandActive">Đang hoạt động</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm thương hiệu'}</button>
              {editing && <button className="btn btn-outline-secondary" type="button" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </div>
        <div className="col-lg-8">
          <div className="card sh-card border-0 p-3 table-responsive">
            {loading ? <p className="text-muted mb-0">Đang tải...</p> : (
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>Thương hiệu</th><th>Sản phẩm</th><th>Trạng thái</th><th className="text-end">Thao tác</th></tr></thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id}>
                      <td>{brand.name}<div className="small text-muted">{brand.slug}</div></td>
                      <td>{brand.productCount}</td>
                      <td><span className={`badge ${brand.isActive ? 'bg-success' : 'bg-secondary'}`}>{brand.isActive ? 'Hoạt động' : 'Đã ẩn'}</span></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => edit(brand)}>Sửa</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => void remove(brand)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && brands.length === 0 && <p className="text-muted text-center my-3">Chưa có thương hiệu.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
