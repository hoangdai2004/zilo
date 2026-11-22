import { create } from 'zustand';
import { CartItem, Coupon, Product } from '../types';
import { api, hasAuthSession } from '../services/api';

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  error: string | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  migrateGuestCart: (items: CartItem[]) => Promise<void>;
  addToCart: (product: Product, options?: { color?: string; storage?: string; quantity?: number; variantId?: string | number }) => Promise<void>;
  removeFromCart: (cartItemId: string | number) => Promise<void>;
  removeItems: (cartItemIds: (string | number)[]) => void;
  updateQuantity: (cartItemId: string | number, quantity: number) => Promise<void>;
  toggleSelectItem: (cartItemId: string | number) => void;
  toggleSelectAll: (selected: boolean) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
}

const readGuestCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem('shophub_cart');
    return stored ? JSON.parse(stored) as CartItem[] : [];
  } catch {
    return [];
  }
};

const persistGuestCart = (items: CartItem[]) => {
  if (!hasAuthSession()) {
    localStorage.setItem('shophub_cart', JSON.stringify(items));
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: readGuestCart(),
  coupon: null,
  error: null,
  isLoading: false,

  fetchCart: async () => {
    if (!hasAuthSession()) return;
    set({ isLoading: true, error: null });
    try {
      const items = await api.cart.get();
      set({ items, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Không thể tải giỏ hàng.' });
    }
  },

  migrateGuestCart: async (guestItems) => {
    try {
      for (const item of guestItems) {
        await api.cart.add(item.productId, item.quantity, item.variantId);
      }
      localStorage.removeItem('shophub_cart');
      await get().fetchCart();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể đồng bộ giỏ hàng.' });
    }
  },

  addToCart: async (product, options) => {
    const color = options?.color || product.colors?.[0] || '';
    const storage = options?.storage || product.storageOptions?.[0] || '';
    const variant = options?.variantId
      ? product.variants?.find((item) => String(item.id) === String(options.variantId))
      : product.variants?.find((item) =>
        (!color || item.color === color) && (!storage || (item.storage || item.size) === storage)
      ) || product.variants?.[0];
    const variantId = variant?.id || options?.variantId;
    const quantity = Math.max(1, options?.quantity || 1);
    set({ error: null });

    try {
      if (hasAuthSession()) {
        await api.cart.add(product.id, quantity, variantId);
        await get().fetchCart();
        return;
      }

      const items = [...get().items];
      const existing = items.find((item) =>
        String(item.productId) === String(product.id) && String(item.variantId || '') === String(variantId || '')
      );
      if (existing) {
        existing.quantity = Math.min(existing.stock, existing.quantity + quantity);
      } else {
        items.push({
          id: `guest-${Date.now()}`,
          productId: product.id,
          variantId,
          name: product.name,
          price: variant?.price ?? product.price,
          originalPrice: product.originalPrice,
          thumbnail: product.thumbnail,
          color,
          storage,
          quantity: Math.min(quantity, variant?.stock ?? product.stock),
          stock: variant?.stock ?? product.stock,
          selected: true,
        });
      }
      set({ items });
      persistGuestCart(items);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ.' });
      throw error;
    }
  },

  removeFromCart: async (cartItemId) => {
    set({ error: null });
    try {
      const item = get().items.find((entry) => entry.id === cartItemId);
      if (item && !String(item.id).startsWith('guest-') && hasAuthSession()) {
        await api.cart.remove(cartItemId);
      }
      const items = get().items.filter((entry) => entry.id !== cartItemId);
      set({ items });
      persistGuestCart(items);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể xóa sản phẩm.' });
    }
  },

  removeItems: (cartItemIds) => {
    const ids = new Set(cartItemIds.map(String));
    const items = get().items.filter((item) => !ids.has(String(item.id)));
    set({ items, coupon: null });
    persistGuestCart(items);
  },

  updateQuantity: async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await get().removeFromCart(cartItemId);
      return;
    }
    const item = get().items.find((entry) => entry.id === cartItemId);
    if (!item) return;
    const boundedQuantity = Math.min(quantity, item.stock);
    set({ error: null });
    try {
      if (!String(item.id).startsWith('guest-') && hasAuthSession()) {
        await api.cart.update(cartItemId, boundedQuantity);
      }
      const items = get().items.map((entry) =>
        entry.id === cartItemId ? { ...entry, quantity: boundedQuantity } : entry
      );
      set({ items });
      persistGuestCart(items);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể cập nhật số lượng.' });
    }
  },

  toggleSelectItem: (cartItemId) => {
    const items = get().items.map((item) =>
      item.id === cartItemId ? { ...item, selected: !item.selected } : item
    );
    set({ items });
    persistGuestCart(items);
  },

  toggleSelectAll: (selected) => {
    const items = get().items.map((item) => ({ ...item, selected }));
    set({ items });
    persistGuestCart(items);
  },

  applyCoupon: async (code) => {
    try {
      const coupon = await api.coupons.check(code.trim().toUpperCase(), get().getSubtotal());
      set({ coupon, error: null });
      return { success: true, message: 'Áp dụng mã giảm giá thành công!' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể áp dụng mã giảm giá.',
      };
    }
  },

  removeCoupon: () => set({ coupon: null }),

  clearCart: () => {
    localStorage.removeItem('shophub_cart');
    set({ items: [], coupon: null, error: null });
  },

  getSubtotal: () => get().items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0),

  getDiscount: () => {
    const { coupon } = get();
    const subtotal = get().getSubtotal();
    if (!coupon || subtotal < coupon.minOrderValue) return 0;
    return coupon.discountType === 'percentage'
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, subtotal);
  },

  getShippingFee: () => {
    const subtotal = get().getSubtotal();
    return subtotal === 0 || subtotal >= 500000 ? 0 : 30000;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    return subtotal === 0 ? 0 : Math.max(0, subtotal - get().getDiscount() + get().getShippingFee());
  },
}));
