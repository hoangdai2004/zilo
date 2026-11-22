import { create } from 'zustand';
import { CartItem, User } from '../types';
import { api } from '../services/api';
import { useCartStore } from './useCartStore';
import { useProductStore } from './useProductStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  fetchProfile: () => Promise<void>;
}

if (typeof window !== 'undefined') {
  window.localStorage.removeItem('shophub_token');
  window.localStorage.removeItem('shophub_user');
}

const readGuestCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem('shophub_cart') || '[]') as CartItem[];
  } catch {
    localStorage.removeItem('shophub_cart');
    return [];
  }
};

const clearGuestSession = () => {
  localStorage.removeItem('shophub_cart');
  useCartStore.setState({ items: [], coupon: null });
  let guestWishlist: (string | number)[] = [];
  try {
    guestWishlist = JSON.parse(localStorage.getItem('shophub_wishlist') || '[]');
  } catch {
    localStorage.removeItem('shophub_wishlist');
  }
  useProductStore.setState({ wishlist: guestWishlist });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const guestItems = readGuestCart();
    try {
      const { user } = await api.auth.login(email, password);
      set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
      if (guestItems.length) {
        await useCartStore.getState().migrateGuestCart(guestItems);
      } else {
        await useCartStore.getState().fetchCart();
      }
      await useProductStore.getState().migrateGuestWishlist();
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Đăng nhập thất bại.',
      });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    const guestItems = readGuestCart();
    try {
      const { user } = await api.auth.register({ name, email, password });
      set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
      if (guestItems.length) {
        await useCartStore.getState().migrateGuestCart(guestItems);
      } else {
        await useCartStore.getState().fetchCart();
      }
      await useProductStore.getState().migrateGuestWishlist();
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Đăng ký thất bại.',
      });
      return false;
    }
  },

  logout: async () => {
    set({ error: null });
    try {
      await api.auth.logout();
      clearGuestSession();
      set({ user: null, isAuthenticated: false, isInitialized: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể xác nhận đăng xuất với máy chủ.' });
    }
  },

  updateProfile: async (data) => {
    const user = await api.auth.updateProfile(data);
    set({ user });
  },

  fetchProfile: async () => {
    try {
      const user = await api.auth.getProfile();
      set({ user, isAuthenticated: true, isInitialized: true });
      await useProductStore.getState().migrateGuestWishlist();
    } catch (error) {
      if (error instanceof Error && error.message.includes('(401)')) {
        set({ user: null, isAuthenticated: false, isInitialized: true });
      } else {
        set({
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Không thể đồng bộ hồ sơ.',
        });
      }
    }
  },
}));
