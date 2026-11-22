import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import { api } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useProductStore();

  const selectedCategoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string | null>(selectedCategoryParam);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Lấy danh sách thương hiệu từ backend
  const [availableBrands, setAvailableBrands] = useState<{ id: string | number; name: string }[]>([]);

  useEffect(() => {
    api.brands.getAll().then((data) => {
      setAvailableBrands(data.map((b) => ({ id: b.id, name: b.name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedCategory(selectedCategoryParam);
  }, [selectedCategoryParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchParam, selectedBrand, priceRange, sortBy]);

  // Gọi API lấy sản phẩm đã lọc từ Backend
  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg('');

    let min_price: number | undefined;
    let max_price: number | undefined;

    if (priceRange === 'under-5m') {
      max_price = 5000000;
    } else if (priceRange === '5m-15m') {
      min_price = 5000000;
      max_price = 15000000;
    } else if (priceRange === 'over-15m') {
      min_price = 15000000;
    }

    api.products.getPaginated({
      category_id: selectedCategory || undefined,
      brand_id: selectedBrand !== 'all' ? selectedBrand : undefined,
      search: searchParam || undefined,
      min_price,
      max_price,
      sort: sortBy,
      page: currentPage,
      per_page: 12,
    }).then((res) => {
      if (active) {
        setProductsList(res.items);
        setTotalCount(res.total);
        setLastPage(res.lastPage);
        setLoading(false);
      }
    }).catch((err: unknown) => {
      if (active) {
        setErrorMsg(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.');
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedCategory, selectedBrand, searchParam, priceRange, sortBy, currentPage]);

  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);
  const activeCategoryName = categories.find((c) => String(c.id) === String(selectedCategory))?.name || 'Tất cả sản phẩm';

  return (
    <div className="container py-4">
      {errorMsg && <div className="alert alert-danger" role="alert">{errorMsg}</div>}
      
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><a href="/" className="text-decoration-none">Trang chủ</a></li>
          <li className="breadcrumb-item active" aria-current="page">{activeCategoryName}</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Left Filter Sidebar */}
        <div className="col-12 col-lg-3">
          <div className="card sh-card border-0 p-3">
            <h6 className="fw-bold mb-3 border-bottom pb-2">Bộ lọc tìm kiếm</h6>

            {/* Danh mục */}
            <div className="mb-4">
              <label className="fw-semibold small text-muted text-uppercase mb-2">Danh mục</label>
              <div className="d-flex flex-column gap-1">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchParams((params) => {
                      params.delete('category');
                      return params;
                    });
                  }}
                  className={`btn btn-sm text-start ${selectedCategory === null ? 'btn-primary' : 'btn-light'}`}
                >
                  Tất cả danh mục
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(String(cat.id));
                      setSearchParams((params) => {
                        params.set('category', String(cat.id));
                        return params;
                      });
                    }}
                    className={`btn btn-sm text-start d-flex justify-content-between align-items-center ${
                      String(selectedCategory) === String(cat.id) ? 'btn-primary' : 'btn-light'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.count ? <small className="opacity-75">({cat.count})</small> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Khoảng giá */}
            <div className="mb-4">
              <label className="fw-semibold small text-muted text-uppercase mb-2">Khoảng giá</label>
              <div className="d-flex flex-column gap-1">
                {[
                  { id: 'all', label: 'Tất cả mức giá' },
                  { id: 'under-5m', label: 'Dưới 5 triệu' },
                  { id: '5m-15m', label: '5 - 15 triệu' },
                  { id: 'over-15m', label: 'Trên 15 triệu' },
                ].map((range) => (
                  <div className="form-check" key={range.id}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="priceRange"
                      id={range.id}
                      checked={priceRange === range.id}
                      onChange={() => setPriceRange(range.id)}
                    />
                    <label className="form-check-label small" htmlFor={range.id}>
                      {range.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Thương hiệu */}
            <div className="mb-3">
              <label className="fw-semibold small text-muted text-uppercase mb-2">Thương hiệu</label>
              <select
                className="form-select form-select-sm"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="all">Tất cả thương hiệu</option>
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="col-12 col-lg-9">
          {/* Header of list: Title, Count & Sort */}
          <div className="bg-white p-3 rounded-3 border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <h4 className="fw-bold mb-1">{activeCategoryName}</h4>
              <span className="text-muted small">{totalCount} sản phẩm tìm thấy</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small text-nowrap">Sắp xếp:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '180px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-5 bg-white rounded-3 border text-muted">
              <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
              Đang tải danh sách sản phẩm...
            </div>
          ) : productsList.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 border">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-2 text-muted">Không tìm thấy sản phẩm nào phù hợp với bộ lọc!</p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedBrand('all');
                  setPriceRange('all');
                  setSearchParams({});
                }}
                className="btn btn-outline-primary btn-sm"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-4 mb-4">
              {productsList.map((product) => (
                <div className="col" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && lastPage > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Trước</button>
                  </li>
                  {pageNumbers.map((page) => (
                    <li className={`page-item ${currentPage === page ? 'active' : ''}`} key={page}>
                      <button className="page-link" aria-current={currentPage === page ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                    <button className="page-link" disabled={currentPage === lastPage} onClick={() => setCurrentPage((page) => page + 1)}>Sau</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
