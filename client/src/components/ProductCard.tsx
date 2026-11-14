import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useProductStore } from '../store/useProductStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const { wishlist, toggleWishlist } = useProductStore();

  const isLiked = wishlist.includes(product.id);
  const quickAddVariant = product.variants?.find((variant) => variant.stock > 0);
  const availableStock = product.variants?.length ? Boolean(quickAddVariant) : product.stock > 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!availableStock) return;
      await addToCart(product, { quantity: 1, variantId: quickAddVariant?.id });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(product.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không thể cập nhật danh sách yêu thích.');
    }
  };

  return (
    <div className="card h-100 sh-card border-0 position-relative">
      {/* Discount badge */}
      {product.discountPercent && (
        <span className="badge bg-danger position-absolute top-0 start-0 m-2 z-1">
          -{product.discountPercent}%
        </span>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleToggleLike}
        className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm z-1"
        style={{ width: '32px', height: '32px', padding: 0 }}
      >
        <i className={`bi ${isLiked ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}`}></i>
      </button>

      {/* Image */}
      <Link to={`/products/${product.id}`} className="text-decoration-none">
        <div
          className="d-flex align-items-center justify-content-center bg-white p-3"
          style={{ height: '200px', overflow: 'hidden' }}
        >
          <img
            src={product.thumbnail}
            alt={product.name}
            className="img-fluid"
            style={{ maxHeight: '180px', objectFit: 'contain', transition: 'transform 0.3s ease' }}
          />
        </div>
      </Link>

      {/* Body */}
      <div className="card-body d-flex flex-column p-3">
        <div className="small text-muted mb-1">{product.categoryName}</div>
        <h6 className="card-title fw-bold mb-2 text-truncate" title={product.name}>
          <Link to={`/products/${product.id}`} className="text-dark text-decoration-none">
            {product.name}
          </Link>
        </h6>

        {/* Rating */}
        <div className="d-flex align-items-center mb-2 small">
          <span className="text-warning me-1">
            <i className="bi bi-star-fill"></i>
          </span>
          <span className="fw-semibold me-1">{product.rating}</span>
          <span className="text-muted">({product.reviewsCount})</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="d-flex align-items-baseline mb-2">
            <span className="text-danger fw-bold fs-6">
              {product.price.toLocaleString('vi-VN')}đ
            </span>
            {product.originalPrice && (
              <span className="text-muted small text-decoration-line-through ms-2">
                {product.originalPrice.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!availableStock}
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
          >
            <i className="bi bi-cart-plus"></i> {availableStock ? 'Thêm vào giỏ' : 'Hết hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
