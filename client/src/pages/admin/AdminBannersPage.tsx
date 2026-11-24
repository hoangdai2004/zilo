import React, { useEffect, useState } from 'react';
import { Banner } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../store/useToastStore';

interface BannerFormState {
  title: string;
  imageUrl: string;
  linkUrl: string;
  description: string;
  order: number;
  isActive: boolean;
}

const emptyForm: BannerFormState = {
  title: '',
  imageUrl: '',
  linkUrl: '/products',
  description: '',
  order: 0,
  isActive: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormState>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.banners.getAllForAdmin();
      setBanners(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      description: banner.description || '',
      order: banner.order,
      isActive: banner.isActive,
    });
    setShowModal(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await api.upload.image(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success('Đã tải ảnh banner lên.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tải ảnh banner.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.warning('Vui lòng nhập tiêu đề và ảnh banner.');
      return;
    }

    try {
      if (editingBanner) {
        const updated = await api.banners.update(editingBanner.id, form);
        setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        toast.success('Cập nhật banner thành công!');
      } else {
        const created = await api.banners.create(form);
        setBanners((prev) => [created, ...prev]);
        toast.success('Tạo banner mới thành công!');
      }
      setShowModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu banner.');
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Bạn có chắc muốn xóa banner "${banner.title}"?`)) return;
    try {
      await api.banners.delete(banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      toast.success('Đã xóa banner.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa banner.');
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const updated = await api.banners.update(banner.id, { isActive: !banner.isActive });
      setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success(`Đã ${updated.isActive ? 'kích hoạt' : 'ẩn'} banner.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0">Quản lý Banner quảng cáo</h4>
          <small className="text-muted">Cấu hình các banner hiển thị trên Trang chủ</small>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          <i className="bi bi-plus-lg me-1"></i> Thêm banner mới
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="card sh-card border-0 p-3 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>Thứ tự</th>
                <th style={{ width: '160px' }}>Hình ảnh</th>
                <th>Tiêu đề &amp; Mô tả</th>
                <th>Liên kết khi bấm</th>
                <th className="text-center" style={{ width: '120px' }}>Trạng thái</th>
                <th className="text-end" style={{ width: '140px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-4">Đang tải danh sách banner...</td></tr>}
              {!loading && banners.map((banner) => (
                <tr key={banner.id}>
                  <td className="fw-bold text-center">{banner.order}</td>
                  <td>
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="rounded border object-fit-cover shadow-xs"
                      style={{ width: '140px', height: '60px' }}
                    />
                  </td>
                  <td>
                    <div className="fw-bold text-dark">{banner.title}</div>
                    {banner.description && (
                      <div className="small text-muted text-truncate" style={{ maxWidth: '350px' }}>
                        {banner.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <code className="small text-primary">{banner.linkUrl || '---'}</code>
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className={`btn btn-sm ${banner.isActive ? 'btn-success' : 'btn-secondary'} rounded-pill px-3`}
                      onClick={() => void handleToggleStatus(banner)}
                    >
                      {banner.isActive ? 'Đang hiện' : 'Đang ẩn'}
                    </button>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleOpenEdit(banner)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => void handleDelete(banner)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !banners.length && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Chưa có banner nào. Bấm nút phía trên để tạo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Banner */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} onClick={() => setShowModal(false)}></div>
          <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header border-bottom py-3">
                    <h5 className="modal-title fw-bold">
                      {editingBanner ? 'Chỉnh sửa Banner' : 'Tạo Banner mới'}
                    </h5>
                    <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Tiêu đề Banner <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Ví dụ: Tuần lễ vàng giảm giá 50%"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Ảnh Banner <span className="text-danger">*</span></label>
                      <div className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          required
                          placeholder="Nhập URL ảnh hoặc bấm Tải ảnh lên"
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        />
                        <label className="btn btn-outline-secondary mb-0">
                          <i className="bi bi-upload me-1"></i> Tải ảnh
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            disabled={uploadingImage}
                            onChange={handleImageFileChange}
                          />
                        </label>
                      </div>
                      {uploadingImage && <small className="text-muted d-block mb-2">Đang tải ảnh lên máy chủ...</small>}
                      {form.imageUrl && (
                        <div className="p-2 border rounded bg-light text-center">
                          <img
                            src={form.imageUrl}
                            alt="Preview"
                            className="img-fluid rounded object-fit-cover"
                            style={{ maxHeight: '140px' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Đường dẫn liên kết (Link URL)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: /products hoặc /products?category=1"
                        value={form.linkUrl}
                        onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Mô tả phụ</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Mô tả ngắn gọn về chương trình khuyến mãi..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label fw-semibold">Thứ tự hiển thị</label>
                        <input
                          type="number"
                          className="form-control"
                          value={form.order}
                          onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-6 d-flex align-items-end">
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="bannerActiveSwitch"
                            checked={form.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="bannerActiveSwitch">
                            Hiển thị ngay
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top bg-light">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-primary px-4">
                      {editingBanner ? 'Lưu thay đổi' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
