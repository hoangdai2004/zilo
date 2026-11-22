import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useProductStore } from '../store/useProductStore';

export default function MainLayout() {
  const { fetchProducts, fetchCategories, fetchWishlist } = useProductStore();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isInitialized, isAuthenticated, fetchCart, fetchWishlist]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
