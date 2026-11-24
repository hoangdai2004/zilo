import { create } from 'zustand';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type'], title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  showToast: (message, type = 'info', title, duration = 3500) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  success: (message, title) => {
    useToastStore.getState().showToast(message, 'success', title);
  },
  error: (message, title) => {
    useToastStore.getState().showToast(message, 'error', title);
  },
  info: (message, title) => {
    useToastStore.getState().showToast(message, 'info', title);
  },
  warning: (message, title) => {
    useToastStore.getState().showToast(message, 'warning', title);
  },
}));

export const toast = {
  success: (message: string, title?: string) => useToastStore.getState().success(message, title),
  error: (message: string, title?: string) => useToastStore.getState().error(message, title),
  info: (message: string, title?: string) => useToastStore.getState().info(message, title),
  warning: (message: string, title?: string) => useToastStore.getState().warning(message, title),
};
