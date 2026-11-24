import axios, { AxiosRequestConfig } from 'axios';
import { Address, Banner, Brand, CartItem, Category, Coupon, Order, Product, ProductVariant, Review, User } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL
  || import.meta.env.REACT_APP_API_URL
  || 'http://localhost:8000/api';

interface ApiRequestOptions extends Pick<AxiosRequestConfig, 'method' | 'headers'> {
  body?: string;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

let authSessionActive = false;

export const hasAuthSession = () => authSessionActive;

export const setAuthSessionActive = (active: boolean) => {
  authSessionActive = active;
};

const API_ORIGIN = new URL(API_BASE_URL).origin;
let csrfCookieRequest: Promise<void> | null = null;

const readXsrfToken = () => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith('XSRF-TOKEN='));
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : null;
};

const getRequestErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const payload = error.response?.data as {
    errors?: Record<string, string[]>;
    message?: string;
  } | undefined;
  const validationErrors = payload?.errors
    ? Object.values(payload.errors).flat().join(' ')
    : '';
  const status = error.response?.status;
  const message = validationErrors || payload?.message || fallback;

  return status ? `${message} (${status})` : message;
};

const ensureCsrfCookie = async () => {
  if (readXsrfToken()) return;

  if (!csrfCookieRequest) {
    csrfCookieRequest = axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { Accept: 'application/json' },
    }).then(() => undefined).catch((error: unknown) => {
      throw new Error(getRequestErrorMessage(error, 'Không thể khởi tạo phiên bảo mật.'));
    }).finally(() => {
      csrfCookieRequest = null;
    });
  }

  await csrfCookieRequest;

  if (!readXsrfToken()) {
    throw new Error('Máy chủ không cấp cookie CSRF. Vui lòng kiểm tra cấu hình domain và CORS.');
  }
};

const request = async <T>(path: string, init: ApiRequestOptions = {}, authenticated = false): Promise<T> => {
  const method = (init.method || 'GET').toUpperCase();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (needsCsrf) await ensureCsrfCookie();
  const xsrfToken = needsCsrf ? readXsrfToken() : null;

  try {
    const response = await apiClient.request<T>({
      url: path,
      method,
      data: init.body ? JSON.parse(init.body) : undefined,
      headers: {
        ...(needsCsrf && xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        ...init.headers,
      },
    });
    return response.data;
  } catch (error) {
    if (authenticated && axios.isAxiosError(error) && error.response?.status === 401) {
      setAuthSessionActive(false);
    }
    throw new Error(getRequestErrorMessage(error, 'Yêu cầu thất bại'));
  }
};

const listFrom = (payload: any): any[] => {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const listAllPages = async (path: string, authenticated = false): Promise<any[]> => {
  const items: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const separator = path.includes('?') ? '&' : '?';
    const payload = await request<any>(`${path}${separator}per_page=100&page=${page}`, {}, authenticated);
    items.push(...listFrom(payload));
    lastPage = Number(payload?.data?.last_page || 1);
    page += 1;
  } while (page <= lastPage);

  return items;
};

export const mapBackendProduct = (p: any): Product => {
  const images: string[] = (p.images || [])
    .map((image: any) => (typeof image === 'string' ? image : image.image_url))
    .filter(Boolean);
  const primaryImg =
    p.images?.find((image: any) => image.is_primary)?.image_url ||
    images[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  const variants: ProductVariant[] = (p.variants || []).map((variant: any) => ({
    id: variant.id,
    name: variant.name || '',
    price: Number(variant.price ?? p.discount_price ?? p.price),
    stock: Number(variant.stock ?? 0),
    color: variant.attributes?.color,
    size: variant.attributes?.size,
    storage: variant.attributes?.storage,
  }));
  const colors = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))) as string[];
  const storageOptions = Array.from(
    new Set(variants.map((variant) => variant.storage || variant.size).filter(Boolean))
  ) as string[];
  const price = Number(p.discount_price && Number(p.discount_price) < Number(p.price) ? p.discount_price : p.price);
  const originalPrice = price < Number(p.price) ? Number(p.price) : undefined;

  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price,
    originalPrice,
    discountPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined,
    stock: Number(p.stock ?? 0),
    categoryId: p.category_id,
    categoryName: p.category?.name || 'Danh mục',
    brandId: p.brand_id,
    brandName: p.brand?.name || 'Zilo',
    thumbnail: primaryImg,
    images: images.length ? images : [primaryImg],
    colors: colors.length ? colors : undefined,
    storageOptions: storageOptions.length ? storageOptions : undefined,
    variants,
    rating: Number(p.average_rating ?? p.reviews_avg_rating ?? 0),
    reviewsCount: Number(p.review_count ?? p.reviews_count ?? p.reviews?.length ?? 0),
    status: p.is_active ? 'active' : 'inactive',
    createdAt: p.created_at,
  };
};

export const mapBackendCategory = (category: any): Category => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  count: category.products_count ?? (Array.isArray(category.products) ? category.products.length : 0),
  isActive: Boolean(category.is_active),
  icon: 'bi-grid',
});

const mapBackendBrand = (brand: any): Brand => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  logo: brand.logo,
  description: brand.description,
  productCount: Number(brand.products_count || 0),
  isActive: Boolean(brand.is_active),
});

export const mapBackendUser = (user: any): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address:
    user.addresses?.find((address: any) => address.is_default)?.address_line ||
    user.addresses?.[0]?.address_line ||
    user.address,
  role: user.role || 'user',
  createdAt: user.created_at,
});

export const mapBackendBanner = (banner: any): Banner => ({
  id: banner.id,
  title: banner.title,
  imageUrl: banner.image_url,
  linkUrl: banner.link_url,
  description: banner.description,
  order: Number(banner.order || 0),
  isActive: Boolean(banner.is_active),
  createdAt: banner.created_at,
});

const mapBackendAddress = (address: any): Address => ({
  id: address.id,
  recipientName: address.recipient_name,
  phone: address.phone,
  addressLine: address.address_line,
  ward: address.ward,
  district: address.district,
  city: address.city,
  isDefault: Boolean(address.is_default),
});

const mapBackendCoupon = (coupon: any): Coupon => ({
  id: coupon.id,
  code: coupon.code,
  discountType: coupon.discount_type,
  discountValue: Number(coupon.discount_value),
  minOrderValue: Number(coupon.min_order_value || 0),
  maxUses: coupon.max_uses,
  usedCount: Number(coupon.orders_count || 0),
  isActive: Boolean(coupon.is_active),
});

const mapBackendCartItem = (item: any): CartItem => {
  const product = item.product || {};
  const variant = item.variant;
  const unitPrice = Number(variant?.price ?? product.discount_price ?? product.price ?? 0);
  const image = product.images?.find((entry: any) => entry.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    '';

  return {
    id: item.id,
    productId: item.product_id ?? product.id,
    variantId: item.variant_id ?? variant?.id,
    name: product.name || item.name || '',
    price: unitPrice,
    originalPrice: product.discount_price ? Number(product.price) : undefined,
    thumbnail: image,
    color: variant?.attributes?.color,
    storage: variant?.attributes?.storage || variant?.attributes?.size,
    quantity: Number(item.quantity),
    stock: Number(variant?.stock ?? product.stock ?? 0),
    selected: true,
  };
};

const mapBackendOrder = (order: any): Order => ({
  id: order.order_number || String(order.id),
  resourceId: order.id,
  userId: order.user_id,
  customerName: order.shipping_name,
  customerPhone: order.shipping_phone,
  customerEmail: order.user?.email,
  shippingAddress: order.shipping_address,
  paymentMethod: order.payments?.[0]?.payment_method || order.latest_payment?.payment_method || 'cod',
  items: (order.items || []).map((item: any) => ({
    ...mapBackendCartItem({ ...item, product: item.product, variant: item.variant }),
    price: Number(item.unit_price),
  })),
  subtotal: Number(order.subtotal),
  discount: Number(order.discount_amount),
  shippingFee: Number(order.shipping_fee),
  total: Number(order.total_amount),
  status: order.status,
  paymentStatus: order.payment_status || order.latest_payment?.status || order.payments?.[0]?.status,
  paymentUrl: order.payment_url,
  createdAt: order.created_at,
});

export const initialProducts: Product[] = [];
export const initialCategories: Category[] = [];

export const api = {
  auth: {
    sendPasswordResetLink: async (email: string): Promise<string> => {
      const payload: any = await request('/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return payload.message;
    },
    resetPassword: async (data: {
      token: string;
      email: string;
      password: string;
      passwordConfirmation: string;
    }): Promise<string> => {
      const payload: any = await request('/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.token,
          email: data.email,
          password: data.password,
          password_confirmation: data.passwordConfirmation,
        }),
      });
      return payload.message;
    },
    login: async (email: string, password: string): Promise<{ user: User }> => {
      const payload: any = await request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      setAuthSessionActive(true);
      return { user: mapBackendUser(payload.data.user) };
    },
    register: async (userData: { name: string; email: string; password: string }): Promise<{ user: User }> => {
      const payload: any = await request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      setAuthSessionActive(true);
      return { user: mapBackendUser(payload.data.user) };
    },
    getProfile: async (): Promise<User> => {
      const payload: any = await request('/profile', {}, true);
      setAuthSessionActive(true);
      return mapBackendUser(payload.data);
    },
    updateProfile: async (userData: Partial<User>): Promise<User> => {
      const payload: any = await request('/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: userData.name, phone: userData.phone }),
      }, true);
      return mapBackendUser(payload.data);
    },
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      await request('/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }, true);
    },
    logout: async (): Promise<void> => {
      await request('/logout', { method: 'POST' }, true);
      setAuthSessionActive(false);
    },
  },
  products: {
    getAll: async (): Promise<Product[]> => {
      return (await listAllPages('/products')).map(mapBackendProduct);
    },
    getPaginated: async (filters: {
      category_id?: string | number | null;
      brand_id?: string | number | null;
      search?: string;
      min_price?: number;
      max_price?: number;
      sort?: string;
      page?: number;
      per_page?: number;
    } = {}): Promise<{ items: Product[]; total: number; currentPage: number; lastPage: number }> => {
      const params = new URLSearchParams();
      if (filters.category_id) params.set('category_id', String(filters.category_id));
      if (filters.brand_id && String(filters.brand_id) !== 'all') params.set('brand_id', String(filters.brand_id));
      if (filters.search) params.set('search', filters.search);
      if (filters.min_price !== undefined) params.set('min_price', String(filters.min_price));
      if (filters.max_price !== undefined) params.set('max_price', String(filters.max_price));
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));

      const payload = await request<any>(`/products?${params.toString()}`);
      const data = payload?.data;
      return {
        items: (data?.data || []).map(mapBackendProduct),
        total: Number(data?.total || 0),
        currentPage: Number(data?.current_page || 1),
        lastPage: Number(data?.last_page || 1),
      };
    },
    getAllForAdmin: async (): Promise<Product[]> => {
      return (await listAllPages('/admin/products', true)).map(mapBackendProduct);
    },
    getById: async (id: string | number): Promise<Product | undefined> => {
      try {
        const payload = await request<any>(`/products/${encodeURIComponent(String(id))}`);
        return payload.data ? mapBackendProduct(payload.data) : undefined;
      } catch (error) {
        if (error instanceof Error && error.message.includes('(404)')) return undefined;
        throw error;
      }
    },
    create: async (product: Partial<Product>): Promise<Product> => {
      const payload: any = await request('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: product.name,
          category_id: product.categoryId,
          brand_id: product.brandId,
          price: product.originalPrice ?? product.price,
          discount_price: product.originalPrice ? product.price : null,
          stock: product.stock,
          thumbnail: product.thumbnail,
          images: product.images,
          description: product.description,
          status: product.status,
        }),
      }, true);
      return mapBackendProduct(payload.data);
    },
    update: async (id: string | number, product: Partial<Product>): Promise<Product> => {
      const payload: any = await request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: product.name,
          category_id: product.categoryId,
          brand_id: product.brandId,
          price: product.originalPrice ?? product.price,
          discount_price: product.originalPrice ? product.price : null,
          stock: product.stock,
          thumbnail: product.thumbnail,
          description: product.description,
          status: product.status,
        }),
      }, true);
      return mapBackendProduct(payload.data);
    },
    delete: async (id: string | number): Promise<boolean> => {
      await request(`/products/${id}`, { method: 'DELETE' }, true);
      return true;
    },
  },
  categories: {
    getAll: async (): Promise<Category[]> => {
      const payload = await request<any>('/categories');
      return listFrom(payload).map(mapBackendCategory);
    },
    getAllForAdmin: async (): Promise<Category[]> => {
      const payload = await request<any>('/admin/categories', {}, true);
      return listFrom(payload).map(mapBackendCategory);
    },
    create: async (category: Pick<Category, 'name'> & Partial<Pick<Category, 'slug' | 'description' | 'isActive'>>): Promise<Category> => {
      const payload: any = await request('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          description: category.description,
          is_active: category.isActive,
        }),
      }, true);
      return mapBackendCategory(payload.data);
    },
    update: async (id: string | number, category: Partial<Category>): Promise<Category> => {
      const payload: any = await request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          description: category.description,
          is_active: category.isActive,
        }),
      }, true);
      return mapBackendCategory(payload.data);
    },
    delete: async (id: string | number): Promise<void> => {
      await request(`/categories/${id}`, { method: 'DELETE' }, true);
    },
  },
  brands: {
    getAll: async (): Promise<Brand[]> => {
      const payload = await request<any>('/brands');
      return listFrom(payload).map(mapBackendBrand);
    },
    getAllForAdmin: async (): Promise<Brand[]> => {
      const payload = await request<any>('/admin/brands', {}, true);
      return listFrom(payload).map(mapBackendBrand);
    },
    create: async (brand: Pick<Brand, 'name'> & Partial<Pick<Brand, 'slug' | 'logo' | 'description' | 'isActive'>>): Promise<Brand> => {
      const payload: any = await request('/brands', {
        method: 'POST',
        body: JSON.stringify({
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo,
          description: brand.description,
          is_active: brand.isActive,
        }),
      }, true);
      return mapBackendBrand(payload.data);
    },
    update: async (id: string | number, brand: Partial<Brand>): Promise<Brand> => {
      const payload: any = await request(`/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo,
          description: brand.description,
          is_active: brand.isActive,
        }),
      }, true);
      return mapBackendBrand(payload.data);
    },
    delete: async (id: string | number): Promise<void> => {
      await request(`/brands/${id}`, { method: 'DELETE' }, true);
    },
  },
  cart: {
    get: async (): Promise<CartItem[]> => {
      const payload: any = await request('/cart', {}, true);
      return (payload.data?.items || []).map(mapBackendCartItem);
    },
    add: async (productId: string | number, quantity: number, variantId?: string | number): Promise<void> => {
      await request('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity, variant_id: variantId }),
      }, true);
    },
    update: async (id: string | number, quantity: number): Promise<void> => {
      await request(`/cart/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }, true);
    },
    remove: async (id: string | number): Promise<void> => {
      await request(`/cart/items/${id}`, { method: 'DELETE' }, true);
    },
    clear: async (): Promise<void> => {
      await request('/cart', { method: 'DELETE' }, true);
    },
  },
  coupons: {
    getAll: async (): Promise<Coupon[]> => {
      const payload = await request<any>('/coupons');
      return listFrom(payload).map(mapBackendCoupon);
    },
    getAllForAdmin: async (): Promise<Coupon[]> => {
      const payload = await request<any>('/admin/coupons', {}, true);
      return listFrom(payload).map(mapBackendCoupon);
    },
    check: async (code: string, amount: number): Promise<Coupon> => {
      const payload: any = await request('/coupons/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, order_amount: amount }),
      });
      return mapBackendCoupon(payload.data.coupon);
    },
    create: async (coupon: Coupon): Promise<Coupon> => {
      const payload: any = await request('/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: coupon.code,
          discount_type: coupon.discountType,
          discount_value: coupon.discountValue,
          min_order_value: coupon.minOrderValue,
          max_uses: coupon.maxUses,
          is_active: coupon.isActive ?? true,
        }),
      }, true);
      return mapBackendCoupon(payload.data);
    },
    update: async (id: string | number, coupon: Partial<Coupon>): Promise<Coupon> => {
      const payload: any = await request(`/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          code: coupon.code,
          discount_type: coupon.discountType,
          discount_value: coupon.discountValue,
          min_order_value: coupon.minOrderValue,
          max_uses: coupon.maxUses,
          is_active: coupon.isActive,
        }),
      }, true);
      return mapBackendCoupon(payload.data);
    },
    delete: async (id: string | number): Promise<void> => {
      await request(`/coupons/${id}`, { method: 'DELETE' }, true);
    },
  },
  orders: {
    getAll: async (): Promise<Order[]> => {
      return (await listAllPages('/orders', true)).map(mapBackendOrder);
    },
    create: async (order: Partial<Order> & { couponCode?: string; note?: string }): Promise<Order> => {
      const payload: any = await request('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shipping_name: order.customerName,
          shipping_phone: order.customerPhone,
          shipping_address: order.shippingAddress,
          payment_method: order.paymentMethod || 'cod',
          coupon_code: order.couponCode,
          notes: order.note,
          items: (order.items || []).map((item) => ({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
        }),
      }, true);
      const mapped = mapBackendOrder(payload.data);
      if (payload.payment_url) {
        mapped.paymentUrl = payload.payment_url;
      }
      return mapped;
    },
    cancel: async (order: Order): Promise<void> => {
      if (order.resourceId === undefined) throw new Error('Thiếu mã định danh của đơn hàng.');
      await request(`/orders/${order.resourceId}/cancel`, { method: 'POST' }, true);
    },
  },
  addresses: {
    getAll: async (): Promise<Address[]> => {
      const payload = await request<any>('/addresses', {}, true);
      return listFrom(payload).map(mapBackendAddress);
    },
    create: async (address: Omit<Address, 'id'>): Promise<Address> => {
      const payload: any = await request('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          recipient_name: address.recipientName,
          phone: address.phone,
          address_line: address.addressLine,
          ward: address.ward,
          district: address.district,
          city: address.city,
          is_default: address.isDefault,
        }),
      }, true);
      return mapBackendAddress(payload.data);
    },
    delete: async (id: string | number): Promise<void> => {
      await request(`/addresses/${id}`, { method: 'DELETE' }, true);
    },
    setDefault: async (id: string | number): Promise<void> => {
      await request(`/addresses/${id}/default`, { method: 'PUT' }, true);
    },
  },
  wishlist: {
    getAll: async (): Promise<Product[]> => {
      const entries = await listAllPages('/wishlist', true);
      return entries.map((entry) => mapBackendProduct(entry.product));
    },
    toggle: async (productId: string | number): Promise<void> => {
      await request('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      }, true);
    },
  },
  reviews: {
    getAll: async (productId: string | number): Promise<any[]> => {
      const payload = await request<any>(`/products/${productId}/reviews`);
      return listFrom(payload);
    },
    create: async (productId: string | number, review: { rating: number; comment: string; images?: string[] }): Promise<any> => {
      const payload: any = await request(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(review),
      }, true);
      return payload.data;
    },
  },
  banners: {
    getAll: async (): Promise<Banner[]> => {
      const payload = await request<any>('/banners');
      return listFrom(payload).map(mapBackendBanner);
    },
    getAllForAdmin: async (): Promise<Banner[]> => {
      const payload = await request<any>('/admin/banners', {}, true);
      return listFrom(payload).map(mapBackendBanner);
    },
    create: async (banner: Partial<Banner>): Promise<Banner> => {
      const payload: any = await request('/admin/banners', {
        method: 'POST',
        body: JSON.stringify({
          title: banner.title,
          image_url: banner.imageUrl,
          link_url: banner.linkUrl,
          description: banner.description,
          order: banner.order,
          is_active: banner.isActive,
        }),
      }, true);
      return mapBackendBanner(payload.data);
    },
    update: async (id: string | number, banner: Partial<Banner>): Promise<Banner> => {
      const payload: any = await request(`/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: banner.title,
          image_url: banner.imageUrl,
          link_url: banner.linkUrl,
          description: banner.description,
          order: banner.order,
          is_active: banner.isActive,
        }),
      }, true);
      return mapBackendBanner(payload.data);
    },
    delete: async (id: string | number): Promise<void> => {
      await request(`/admin/banners/${id}`, { method: 'DELETE' }, true);
    },
  },
  admin: {
    getDashboard: async () => {
      const payload: any = await request('/admin/dashboard', {}, true);
      return {
        productsCount: Number(payload.data.products_count),
        activeProductsCount: Number(payload.data.active_products_count),
        customersCount: Number(payload.data.customers_count),
        ordersCount: Number(payload.data.orders_count),
        pendingOrdersCount: Number(payload.data.pending_orders_count),
        revenue: Number(payload.data.revenue),
        last30DaysRevenue: Number(payload.data.last_30_days_revenue),
        recentOrders: (payload.data.recent_orders || []).map(mapBackendOrder),
      };
    },
    getOrders: async (page = 1, search = '', status = '') => {
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      const payload: any = await request(`/admin/orders?${params.toString()}`, {}, true);
      return {
        items: listFrom(payload).map(mapBackendOrder),
        currentPage: Number(payload.data.current_page || 1),
        lastPage: Number(payload.data.last_page || 1),
        total: Number(payload.data.total || 0),
      };
    },
    updateOrderStatus: async (orderId: string | number, status: Order['status']): Promise<Order> => {
      const payload: any = await request(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, true);
      return mapBackendOrder(payload.data);
    },
    getCustomers: async (page = 1, search = '') => {
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set('search', search.trim());
      const payload: any = await request(`/admin/customers?${params.toString()}`, {}, true);
      return {
        items: listFrom(payload),
        currentPage: Number(payload.data.current_page || 1),
        lastPage: Number(payload.data.last_page || 1),
        total: Number(payload.data.total || 0),
      };
    },
  },
  upload: {
    image: async (file: File): Promise<string> => {
      await ensureCsrfCookie();
      const xsrfToken = readXsrfToken();
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiClient.post<{ data: { url: string; path: string } }>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
      });
      return res.data.data.url;
    },
  },
  payment: {
    createVNPayUrl: async (orderId: string | number): Promise<string> => {
      const payload: any = await request(`/payment/vnpay-create-url/${orderId}`, {
        method: 'POST',
      }, true);
      return payload.payment_url;
    },
    verifyVNPayReturn: async (queryString: string): Promise<any> => {
      return await request(`/payment/vnpay-return${queryString}`);
    },
  },
};
