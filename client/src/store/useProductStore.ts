import { create } from 'zustand';
import { Product, Category } from '../types';
import { api, hasAuthSession, initialProducts, initialCategories } from '../services/api';

interface ProductState {
  products: Product[];
  categories: Category[];
  wishlist: (string | number)[];
  searchQuery: string;
  selectedCategoryId: string | number | null;
  sortBy: string;
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchWishlist: () => Promise<Product[]>;
  migrateGuestWishlist: () => Promise<void>;
  setWishlist: (wishlist: (string | number)[]) => void;
  setProducts: (products: Product[]) => void;
  setProduct: (product: Product) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (catId: string | number | null) => void;
  setSortBy: (sort: string) => void;
  toggleWishlist: (productId: string | number) => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string | number, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string | number) => Promise<boolean>;
}

const readWishlist = (): (string | number)[] => {
  try {
    return JSON.parse(localStorage.getItem('shophub_wishlist') || '[]');
  } catch {
    localStorage.removeItem('shophub_wishlist');
    return [];
  }
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: initialProducts,
  categories: initialCategories,
  wishlist: readWishlist(),
  searchQuery: '',
  selectedCategoryId: null,
  sortBy: 'popular',
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await api.products.getAll();
      set({ products, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Không thể tải sản phẩm.',
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await api.categories.getAll();
      set({ categories });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể tải danh mục.' });
    }
  },

  fetchWishlist: async () => {
    if (!hasAuthSession()) return [];
    try {
      const products = await api.wishlist.getAll();
      set({ wishlist: products.map((product) => product.id) });
      return products;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể tải danh sách yêu thích.' });
      return [];
    }
  },
  migrateGuestWishlist: async () => {
    let guestWishlist: (string | number)[];
    try {
      guestWishlist = JSON.parse(localStorage.getItem('shophub_wishlist') || '[]');
    } catch {
      localStorage.removeItem('shophub_wishlist');
      guestWishlist = [];
    }

    if (!guestWishlist.length || !hasAuthSession()) return;

    try {
      const currentProducts = await api.wishlist.getAll();
      const currentIds = new Set(currentProducts.map((product) => String(product.id)));
      for (const productId of guestWishlist) {
        if (!currentIds.has(String(productId))) {
          await api.wishlist.toggle(productId);
        }
      }
      localStorage.removeItem('shophub_wishlist');
      const products = await api.wishlist.getAll();
      set({ wishlist: products.map((product) => product.id), error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể đồng bộ danh sách yêu thích.' });
    }
  },
  setWishlist: (wishlist) => set({ wishlist }),

  setProduct: (product) => set((state) => ({
    products: state.products.some((entry) => String(entry.id) === String(product.id))
      ? state.products.map((entry) => String(entry.id) === String(product.id) ? product : entry)
      : [product, ...state.products],
  })),
  setProducts: (products) => set({ products }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (catId) => set({ selectedCategoryId: catId }),
  setSortBy: (sort) => set({ sortBy: sort }),

  toggleWishlist: async (productId) => {
    const current = get().wishlist;
    const exists = current.some((id) => String(id) === String(productId));
    if (hasAuthSession()) {
      try {
        await api.wishlist.toggle(productId);
        const wishlist = exists
          ? current.filter((id) => String(id) !== String(productId))
          : [...current, productId];
        set({ wishlist, error: null });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Không thể cập nhật yêu thích.' });
        throw error;
      }
      return;
    }

    const wishlist = exists
      ? current.filter((id) => String(id) !== String(productId))
      : [...current, productId];
    localStorage.setItem('shophub_wishlist', JSON.stringify(wishlist));
    set({ wishlist });
  },

  addProduct: async (productData) => {
    const newProduct = await api.products.create(productData);
    set({ products: [newProduct, ...get().products] });
    return newProduct;
  },

  updateProduct: async (id, productData) => {
    const updated = await api.products.update(id, productData);
    set({ products: get().products.map((product) => String(product.id) === String(id) ? updated : product) });
    return updated;
  },

  deleteProduct: async (id) => {
    await api.products.delete(id);
    set({ products: get().products.filter((product) => String(product.id) !== String(id)) });
    return true;
  },
}));
