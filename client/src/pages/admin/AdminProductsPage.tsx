import React, { useEffect, useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { Brand, Product } from '../../types';
import { api } from '../../services/api';

export default function AdminProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, setProducts } = useProductStore();
  const [brands, setBrands] = useState<Brand[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMessage('');
    try {
      const url = await api.upload.image(file);
      setForm((prev) => ({ ...prev, thumbnail: url }));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.products.getAllForAdmin(),
      api.categories.getAllForAdmin(),
      api.brands.getAllForAdmin(),
    ]).then(([allProducts, allCategories, allBrands]) => {
      setProducts(allProducts);
      useProductStore.setState({ categories: allCategories });
      setBrands(allBrands);
    }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.');
    }).finally(() => setIsLoading(false));
  }, [setProducts]);

  const [form, setForm] = useState<{
    name: string;
    categoryId: string | number;
    brandId: string | number;
    price: number;
    stock: number;
    thumbnail: string;
    status: 'active' | 'inactive';
    description: string;
  }>({
    name: '',
    categoryId: 1,
    brandId: 1,
    price: 0,
    stock: 10,
    thumbnail: '',
    status: 'active',
    description: '',
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      categoryId: categories[0]?.id || 1,
      brandId: brands[0]?.id || 1,
      price: 0,
      stock: 10,
      thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      status: 'active',
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      brandId: p.brandId || brands[0]?.id || 1,
      price: p.price,
      stock: p.stock,
      thumbnail: p.thumbnail,
      status: p.status,
      description: p.description,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => String(c.id) === String(form.categoryId));
    setErrorMessage('');
    setIsSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          ...form,
          categoryName: cat?.name || 'Khác',
          brandId: form.brandId,
        });
      } else {
        await addProduct({
          ...form,
          categoryName: cat?.name || 'Khác',
          brandId: form.brandId,
          brandName: brands.find((brand) => String(brand.id) === String(form.brandId))?.name,
          images: [form.thumbnail],
        });
      }
      setShowModal(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu sản phẩm.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setErrorMessage('');
      try {
        await deleteProduct(id);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Không thể xóa sản phẩm.');
      }
    }
  };

  return (
    <div>
      {/* Top Header */}
      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Quản lý sản phẩm</h4>
          <span className="text-muted small">Tổng cộng {products.length} sản phẩm trong hệ thống</span>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-plus-lg"></i> Thêm sản phẩm
        </button>
      </div>

      {/* Table Card */}
      <div className="card sh-card border-0 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light small text-muted text-uppercase">
              <tr>
                <th style={{ width: '80px' }}>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th className="text-end" style={{ width: '120px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center text-muted py-4">Đang tải sản phẩm...</td></tr>}
              {!isLoading && products.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Chưa có sản phẩm.</td></tr>}
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="rounded border"
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                  </td>
                  <td>
                    <div className="fw-bold text-dark">{p.name}</div>
                    <small className="text-muted">{p.brandName || 'Chính hãng'}</small>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{p.categoryName}</span>
                  </td>
                  <td className="fw-semibold text-danger">
                    {p.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td>
                    <span className={`fw-semibold ${p.stock < 10 ? 'text-danger' : 'text-dark'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    {p.status === 'active' ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                        Hiển thị
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                        Ẩn
                      </span>
                    )}
                  </td>
                  <td className="text-end">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="btn btn-sm btn-outline-primary me-2"
                      title="Chỉnh sửa"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-sm btn-outline-danger"
                      title="Xóa"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-semibold">Tên sản phẩm *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Danh mục *</label>
                      <select
                        className="form-select"
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Thương hiệu *</label>
                      <select
                        className="form-select"
                        required
                        value={form.brandId}
                        onChange={(e) => setForm({ ...form, brandId: Number(e.target.value) })}
                      >
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}{brand.isActive ? '' : ' (đã ẩn)'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Giá bán (VNĐ) *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Số lượng tồn kho *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-semibold">Ảnh đại diện (Thumbnail) *</label>
                      <div className="input-group">
                        <input
                          type="url"
                          className="form-control"
                          required
                          placeholder="Dán URL hoặc bấm tải ảnh từ máy..."
                          value={form.thumbnail}
                          onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                        />
                        <label className="btn btn-outline-primary mb-0 d-flex align-items-center gap-1">
                          {isUploading ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up-fill"></i> Tải ảnh lên</>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Trạng thái</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      >
                        <option value="active">Hiển thị</option>
                        <option value="inactive">Ẩn</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Mô tả sản phẩm</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary fw-semibold">
                    {isSaving ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
