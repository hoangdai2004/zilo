export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  role: 'user' | 'admin';
  avatar?: string;
  createdAt?: string;
}

export interface Category {
  id: string | number;
  name: string;
  icon?: string;
  count?: number;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface Brand {
  id: string | number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  productCount?: number;
  isActive: boolean;
}

export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stock: number;
  categoryId: string | number;
  categoryName: string;
  brandId?: string | number;
  brandName?: string;
  thumbnail: string;
  images: string[];
  colors?: string[];
  storageOptions?: string[];
  variants?: ProductVariant[];
  rating: number;
  reviewsCount: number;
  status: 'active' | 'inactive';
  specs?: Record<string, string>;
  createdAt?: string;
}

export interface ProductVariant {
  id: string | number;
  name: string;
  price: number;
  stock: number;
  color?: string;
  size?: string;
  storage?: string;
}

export interface CartItem {
  id: string | number; // Cart item unique id
  productId: string | number;
  variantId?: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  color?: string;
  storage?: string;
  quantity: number;
  stock: number;
  selected: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  id?: string | number;
  maxUses?: number | null;
  usedCount?: number;
  isActive?: boolean;
}

export interface Address {
  id: string | number;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  resourceId?: string | number;
  userId: string | number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  paymentStatus?: string;
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee?: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentUrl?: string;
  createdAt: string;
}

export interface Review {
  id: string | number;
  userId: string | number;
  userName: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
}

export interface Banner {
  id: string | number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

