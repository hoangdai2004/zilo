import React, { useCallback, useEffect, useState } from 'react';
import { Category } from '../../types';
import { api } from '../../services/api';
import { useProductStore } from '../../store/useProductStore';

export default function AdminCategoriesPage() {
  const { fetchCategories } = useProductStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await api.categories.getAllForAdmin());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIsActive(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editing) {
        const updated = await api.categories.update(editing.id, { name, description, isActive });
        setCategories((current) => current.map((category) => String(category.id) === String(updated.id) ? updated : category));
      } else {
        const created = await api.categories.create({ name, description, isActive });
        setCategories((current) => [...current, created]);
      }
      await fetchCategories();
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể lưu danh mục.');
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;
    setError('');
    try {
      await api.categories.delete(category.id);
      setCategories((current) => current.filter((entry) => entry.id !== category.id));
      await fetchCategories();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xóa danh mục.');
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-4">Quản lý danh mục</h4>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-4">
        <div className="col-lg-4">
          <form className="card sh-card border-0 p-3" onSubmit={submit}>
            <h6 className="fw-bold">{editing ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h6>
            <label className="form-label small">Tên danh mục</label>
            <input className="form-control mb-3" required value={name} onChange={(event) => setName(event.target.value)} />
            <label className="form-label small">Mô tả</label>
            <textarea className="form-control mb-3" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            <div className="form-check mb-3">
              <input className="form-check-input" id="categoryActive" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              <label className="form-check-label" htmlFor="categoryActive">Đang hoạt động</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit">{editing ? 'Lưu thay đổi' : 'Thêm danh mục'}</button>
              {editing && <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>Hủy</button>}
            </div>
          </form>
        </div>
        <div className="col-lg-8">
          <div className="card sh-card border-0 p-3">
            {loading ? <p className="text-muted mb-0">Đang tải...</p> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead><tr><th>Tên danh mục</th><th>Số sản phẩm</th><th>Trạng thái</th><th className="text-end">Thao tác</th></tr></thead>
                  <tbody>{categories.map((category) => (
                    <tr key={category.id}>
                      <td><strong>{category.name}</strong><div className="small text-muted">{category.slug}</div></td>
                      <td>{category.count ?? 0}</td>
                      <td><span className={`badge ${category.isActive ? 'bg-success' : 'bg-secondary'}`}>{category.isActive ? 'Hoạt động' : 'Đã ẩn'}</span></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => {
                          setEditing(category);
                          setName(category.name);
                          setDescription(category.description || '');
                          setIsActive(category.isActive ?? true);
                        }}>Sửa</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => void remove(category)}>Xóa</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
                {!categories.length && <p className="text-muted text-center my-3">Chưa có danh mục.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
