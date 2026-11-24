import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import { useCartStore } from '../store/useCartStore';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useToastStore';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { products, wishlist, toggleWishlist, setProduct } = useProductStore();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const product: Product | undefined = products.find((p) => String(p.id) === String(id));
  useDocumentTitle(product ? product.name : undefined);

  const [isLoadingProduct, setIsLoadingProduct] = useState(!product);
  const [loadError, setLoadError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>(product?.thumbnail || '');
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors?.[0] || '');
  const [selectedStorage, setSelectedStorage] = useState<string>(product?.storageOptions?.[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [addedToast, setAddedToast] = useState(false);
  const [addError, setAddError] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploadingReviewImage, setIsUploadingReviewImage] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoadingProduct(true);
    setLoadError('');
    api.products.getById(id || '').then((detail) => {
      if (!active) return;
      if (!detail) {
        setLoadError('Không tìm thấy sản phẩm này.');
        return;
      }
      setProduct(detail);
      setSelectedImage(detail.thumbnail);
      setSelectedColor(detail.colors?.[0] || '');
      setSelectedStorage(detail.storageOptions?.[0] || '');
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Không thể tải thông tin sản phẩm.');
    }).finally(() => {
      if (active) setIsLoadingProduct(false);
    });
    return () => { active = false; };
  }, [id, setProduct]);

  useEffect(() => {
    let active = true;
    setReviewsError('');
    api.reviews.getAll(id || '').then((data) => {
      if (active) setReviews(data);
    }).catch((error: unknown) => {
      if (active) setReviewsError(error instanceof Error ? error.message : 'Không thể tải đánh giá.');
    });
    return () => { active = false; };
  }, [id]);

  if (isLoadingProduct && !product) {
    return <div className="container py-5 text-center" role="status">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h4>{loadError || 'Không tìm thấy sản phẩm!'}</h4>
        <Link to="/products" className="btn btn-primary mt-3">Quay lại danh sách</Link>
      </div>
    );
  }

  const isLiked = wishlist.includes(product.id);
  const selectedVariant = product.variants?.find((variant) =>
    (!selectedColor || variant.color === selectedColor) &&
    (!selectedStorage || (variant.storage || variant.size) === selectedStorage)
  );
  const availableStock = selectedVariant?.stock ?? product.stock;

  const handleAddToCart = async () => {
    setAddError('');
    if (product.variants?.length && !selectedVariant) {
      setAddError('Tổ hợp màu sắc/kích thước này không có sẵn.');
      return;
    }
    if (availableStock < 1) {
      setAddError('Sản phẩm đã hết hàng.');
      return;
    }
    try {
      await addToCart(product, {
        color: selectedColor,
        storage: selectedStorage,
        quantity,
        variantId: selectedVariant?.id,
      });
      toast.success(`Đã thêm ${quantity}x "${product.name}" vào giỏ hàng!`, 'Giỏ hàng');
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ.');
    }
  };

  const handleUploadReviewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (reviewImages.length >= 3) {
      toast.warning('Bạn chỉ có thể đính kèm tối đa 3 ảnh.');
      return;
    }
    setIsUploadingReviewImage(true);
    try {
      const url = await api.upload.image(file);
      setReviewImages((prev) => [...prev, url]);
      toast.success('Đã tải ảnh lên.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingReviewImage(false);
      e.target.value = '';
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewsError('');
    setReviewSuccess('');
    try {
      await api.reviews.create(product.id, {
        ...reviewForm,
        images: reviewImages,
      });
      setReviews(await api.reviews.getAll(product.id));
      const refreshedProduct = await api.products.getById(product.id);
      if (refreshedProduct) setProduct(refreshedProduct);
      setReviewForm({ rating: 5, comment: '' });
      setReviewImages([]);
      setReviewSuccess('Cảm ơn bạn đã gửi đánh giá.');
      toast.success('Gửi đánh giá thành công!');
    } catch (error) {
      setReviewsError(error instanceof Error ? error.message : 'Không thể gửi đánh giá.');
    }
  };

  return (
    <div className="container py-4">
      {/* Toast alert when added */}
      {addedToast && (
        <div className="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-4 z-3 shadow" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Đã thêm <strong>{product.name}</strong> vào giỏ hàng!
        </div>
      )}
      {addError && <div className="alert alert-danger" role="alert">{addError}</div>}

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Trang chủ</Link></li>
          <li className="breadcrumb-item"><Link to="/products" className="text-decoration-none">{product.categoryName}</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      {/* Product Main Section (Left Gallery + Right Options) */}
      <div className="card sh-card border-0 p-4 mb-4">
        <div className="row g-4">
          {/* Gallery Image View */}
          <div className="col-12 col-md-5">
            <div className="d-flex flex-column gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-white border rounded-3 p-4"
                style={{ height: '380px' }}
              >
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="img-fluid"
                  style={{ maxHeight: '340px', objectFit: 'contain' }}
                />
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="d-flex gap-2 overflow-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`btn p-1 border rounded-2 ${selectedImage === img ? 'border-primary' : ''}`}
                      style={{ width: '70px', height: '70px' }}
                    >
                      <img src={img} alt="" className="img-fluid h-100 w-100" style={{ objectFit: 'contain' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="col-12 col-md-7">
            <h2 className="fw-bold text-dark mb-2">{product.name}</h2>

            {/* Rating */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="text-warning">
                {Array.from({ length: 5 }, (_, index) => (
                  <i key={index} className={`bi ${index < Math.round(product.rating) ? 'bi-star-fill' : 'bi-star'}`}></i>
                ))}
              </div>
              <span className="fw-semibold">{product.rating}</span>
              <span className="text-muted">({product.reviewsCount} đánh giá)</span>
              <span className={`badge ${availableStock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} ms-2`}>
                {availableStock > 0 ? `Còn hàng (${availableStock})` : 'Hết hàng'}
              </span>
            </div>

            {/* Price Box */}
            <div className="bg-light p-3 rounded-3 mb-4 d-flex align-items-center gap-3">
              <span className="fs-2 fw-bold text-danger">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
              {product.originalPrice && (
                <span className="text-muted text-decoration-line-through fs-5">
                  {product.originalPrice.toLocaleString('vi-VN')}đ
                </span>
              )}
              {product.discountPercent && (
                <span className="badge bg-danger">-{product.discountPercent}%</span>
              )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-3">
                <label className="fw-semibold text-dark mb-2">Màu sắc: <span className="text-primary">{selectedColor}</span></label>
                <div className="d-flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      disabled={Boolean(product.variants?.length && !product.variants.some((variant) =>
                        variant.color === color && (!selectedStorage || (variant.storage || variant.size) === selectedStorage)
                      ))}
                      onClick={() => setSelectedColor(color)}
                      className={`btn btn-sm px-3 rounded-pill ${
                        selectedColor === color ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage / Size Selector */}
            {product.storageOptions && product.storageOptions.length > 0 && (
              <div className="mb-4">
                <label className="fw-semibold text-dark mb-2">Dung lượng / Kích thước: <span className="text-primary">{selectedStorage}</span></label>
                <div className="d-flex flex-wrap gap-2">
                  {product.storageOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={Boolean(product.variants?.length && !product.variants.some((variant) =>
                        (!selectedColor || variant.color === selectedColor) &&
                        (variant.storage || variant.size) === opt
                      ))}
                      onClick={() => setSelectedStorage(opt)}
                      className={`btn btn-sm px-3 rounded-3 ${
                        selectedStorage === opt ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-4 d-flex align-items-center gap-3">
              <label className="fw-semibold text-dark">Số lượng:</label>
              <div className="input-group" style={{ width: '130px' }}>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <input
                  type="text"
                  className="form-control text-center bg-white"
                  value={quantity}
                  readOnly
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={availableStock < 1 || Boolean(product.variants?.length && !selectedVariant)}
                className="btn btn-primary btn-lg px-4 d-flex align-items-center gap-2 shadow-sm"
              >
                <i className="bi bi-cart-plus-fill fs-5"></i> Thêm vào giỏ hàng
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`btn btn-lg px-4 ${isLiked ? 'btn-danger' : 'btn-outline-danger'}`}
              >
                <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
                {isLiked ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
            </div>

            {/* Guarantees */}
            <div className="border-top pt-3 d-flex flex-column gap-2 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-truck text-primary"></i> Giao hàng nhanh 2-3 ngày toàn quốc
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-arrow-counterclockwise text-success"></i> Đổi trả miễn phí trong 7 ngày
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-info"></i> Bảo hành chính hãng 12 tháng
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specs, Reviews */}
      <div className="card sh-card border-0 p-4">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === 'desc' ? 'active text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('desc')}
            >
              Mô tả sản phẩm
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === 'specs' ? 'active text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('specs')}
            >
              Thông số kỹ thuật
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === 'reviews' ? 'active text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({product.reviewsCount})
            </button>
          </li>
        </ul>

        {activeTab === 'desc' && (
          <div className="lh-lg text-secondary">
            <p>{product.description}</p>
            <p>
              Sở hữu ngay sản phẩm chính hãng tại ShopHub để nhận trọn bộ quà tặng và ưu đãi bảo hành đặc quyền.
            </p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div>
            {product.specs ? (
              <table className="table table-striped table-bordered">
                <tbody>
                  {Object.entries(product.specs).map(([key, val]) => (
                    <tr key={key}>
                      <th style={{ width: '30%' }}>{key}</th>
                      <td>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">Thông số kỹ thuật đang được cập nhật...</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
              <div className="display-4 fw-bold text-warning">{product.rating}</div>
              <div>
                <div className="text-warning fs-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <i key={index} className={`bi ${index < Math.round(product.rating) ? 'bi-star-fill' : 'bi-star'}`}></i>
                  ))}
                </div>
                <div className="text-muted small">Dựa trên {product.reviewsCount} lượt đánh giá thực tế</div>
              </div>
            </div>

            {reviewsError && <p className="text-danger small">{reviewsError}</p>}
            <div className="d-flex flex-column gap-3">
              {reviews.map((review) => (
                <div className="border-bottom pb-3" key={review.id}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-semibold">{review.user?.name || 'Khách hàng'}</span>
                    <span className="text-muted small">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="text-warning small mb-1" aria-label={`${review.rating} trên 5 sao`}>
                    {'★'.repeat(Number(review.rating))}
                  </div>
                  <p className="text-secondary small mb-2">{review.comment || 'Không có nhận xét.'}</p>
                  {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {review.images.map((imgUrl: string, imgIdx: number) => (
                        <a key={imgIdx} href={imgUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={imgUrl}
                            alt="Ảnh đánh giá"
                            className="rounded-3 border object-fit-cover shadow-xs"
                            style={{ width: '64px', height: '64px' }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!reviews.length && !reviewsError && <p className="text-muted small mb-0">Sản phẩm chưa có đánh giá.</p>}
            </div>
            <hr />
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="mt-3">
                <h6 className="fw-bold">Viết đánh giá</h6>
                <label className="form-label small" htmlFor="reviewRating">Số sao</label>
                <select
                  id="reviewRating"
                  className="form-select mb-2"
                  style={{ maxWidth: 180 }}
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} sao</option>)}
                </select>
                <label className="form-label small" htmlFor="reviewComment">Nhận xét</label>
                <textarea
                  id="reviewComment"
                  className="form-control mb-2"
                  rows={3}
                  maxLength={1000}
                  placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..."
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                />

                {/* Upload ảnh đánh giá thực tế */}
                <div className="mb-3">
                  <label className="form-label small d-block">Hình ảnh thực tế (tối đa 3 ảnh):</label>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    {reviewImages.map((img, idx) => (
                      <div key={idx} className="position-relative">
                        <img
                          src={img}
                          alt="Review preview"
                          className="rounded-2 border object-fit-cover"
                          style={{ width: '60px', height: '60px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle"
                          style={{ width: '18px', height: '18px', lineHeight: '14px', fontSize: '10px' }}
                          onClick={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 3 && (
                      <label className="btn btn-outline-secondary btn-sm d-flex flex-column align-items-center justify-content-center p-2 rounded-2 cursor-pointer mb-0" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-camera fs-5"></i>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          disabled={isUploadingReviewImage}
                          onChange={handleUploadReviewImage}
                        />
                      </label>
                    )}
                    {isUploadingReviewImage && <span className="small text-muted">Đang tải ảnh lên...</span>}
                  </div>
                </div>

                <button className="btn btn-primary btn-sm" type="submit" disabled={isUploadingReviewImage}>
                  Gửi đánh giá
                </button>
                {reviewSuccess && <span className="text-success small ms-3">{reviewSuccess}</span>}
              </form>
            ) : (
              <p className="small text-muted mt-3 mb-0">
                <Link to="/sign-in">Đăng nhập</Link> để gửi đánh giá.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
