import { create } from 'zustand';

/**
 * ============================================================================
 * HỌC ZUSTAND TỪ A - Z: ĐỊNH NGHĨA STORE
 * ============================================================================
 * 
 * Zustand hoạt động dựa trên 1 nguyên lý rất đơn giản:
 * 1. Store là một Hook (bắt đầu bằng chữ `use...`)
 * 2. `set`: hàm cập nhật state (tự động merge state ở tầng nông giống this.setState)
 * 3. `get`: hàm đọc state hiện tại ở bất kỳ đâu trong action mà không cần truyền tham số
 */

// 1. Định nghĩa kiểu dữ liệu của State và Actions (TypeScript Interface)
export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TutorialState {
  // --- STATE (Dữ liệu lưu trữ) ---
  count: number;
  message: string;
  todos: TodoItem[];
  isLoading: boolean;

  // --- ACTIONS (Các hàm thay đổi dữ liệu) ---
  // Action đồng bộ cơ bản
  increment: () => void;
  decrement: () => void;
  resetCount: () => void;
  setMessage: (msg: string) => void;

  // Action làm việc với mảng
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;

  // Action bất đồng bộ (Async Action - gọi API)
  fetchFakeNotification: () => Promise<void>;

  // Reset toàn bộ store về mặc định
  resetAll: () => void;
}

// 2. Giá trị khởi tạo mặc định (Initial State)
const initialState = {
  count: 0,
  message: 'Chào mừng bạn đến với bài học Zustand!',
  todos: [
    { id: 1, text: 'Hiểu khái niệm create() trong Zustand', completed: true },
    { id: 2, text: 'Thực hành hàm set() và get()', completed: false },
    { id: 3, text: 'Dùng Selector để tối ưu Render', completed: false },
  ],
  isLoading: false,
};

// 3. Khởi tạo store với create<T>((set, get) => ({ ... }))
export const useTutorialStore = create<TutorialState>((set, get) => ({
  ...initialState,

  // Tăng count lên 1: set nhận vào một hàm trả về object state mới
  increment: () => set((state) => ({ count: state.count + 1 })),

  // Giảm count: có thể dùng get() để kiểm tra logic trước khi set
  decrement: () => {
    const currentCount = get().count;
    if (currentCount > 0) {
      set({ count: currentCount - 1 });
    }
  },

  resetCount: () => set({ count: 0 }),

  setMessage: (message: string) => set({ message }),

  // Thêm todo: copy mảng cũ và thêm phần tử mới
  addTodo: (text: string) => {
    if (!text.trim()) return;
    const newTodo: TodoItem = {
      id: Date.now(),
      text,
      completed: false,
    };
    set((state) => ({
      todos: [newTodo, ...state.todos],
    }));
  },

  toggleTodo: (id: number) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  },

  removeTodo: (id: number) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  },

  // Action bất đồng bộ (Async): Không cần middleware redux-thunk hay saga!
  // Chỉ cần dùng async/await bình thường và gọi set() tại mỗi thời điểm.
  fetchFakeNotification: async () => {
    set({ isLoading: true });
    try {
      // Giả lập độ trễ mạng 1.2 giây
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const fakeNotifications = [
        'Đơn hàng #ZILO-888 của bạn đã được giao thành công! 🎉',
        'Zilo vừa tung mã giảm giá 50k cho khách hàng mới! 🏷️',
        'Có 3 sản phẩm mới được thêm vào danh mục Điện thoại! 📱',
      ];
      const randomMsg = fakeNotifications[Math.floor(Math.random() * fakeNotifications.length)];

      set({
        message: randomMsg,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, message: 'Lỗi tải thông báo!' });
    }
  },

  resetAll: () => set(initialState),
}));

