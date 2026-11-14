import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTutorialStore } from '../store/useTutorialStore';

export default function LearnZustandPage() {
  // =========================================================================
  // 1. CÁCH LẤY STATE & ACTIONS TỪ ZUSTAND STORE
  // =========================================================================
  // Cách chuẩn: Dùng selector `(state) => state.xxx` để Component CHỈ re-render
  // khi thuộc tính đó thay đổi, tối ưu hiệu năng tối đa.
  const count = useTutorialStore((state) => state.count);
  const message = useTutorialStore((state) => state.message);
  const todos = useTutorialStore((state) => state.todos);
  const isLoading = useTutorialStore((state) => state.isLoading);

  const increment = useTutorialStore((state) => state.increment);
  const decrement = useTutorialStore((state) => state.decrement);
  const resetCount = useTutorialStore((state) => state.resetCount);
  const setMessage = useTutorialStore((state) => state.setMessage);
  const addTodo = useTutorialStore((state) => state.addTodo);
  const toggleTodo = useTutorialStore((state) => state.toggleTodo);
  const removeTodo = useTutorialStore((state) => state.removeTodo);
  const fetchFakeNotification = useTutorialStore((state) => state.fetchFakeNotification);
  const resetAll = useTutorialStore((state) => state.resetAll);

  // State nội bộ thông thường của Component (chỉ dùng cho form input)
  const [inputText, setInputText] = useState('');
  const [msgInput, setMsgInput] = useState('');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      addTodo(inputText);
      setInputText('');
    }
  };

  const handleUpdateMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (msgInput.trim()) {
      setMessage(msgInput);
      setMsgInput('');
    }
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Trang chủ</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Học Zustand trong dự án Zilo</li>
        </ol>
      </nav>

      {/* Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 text-white p-4 p-md-5 mb-4"
           style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="badge bg-white text-success px-3 py-2 rounded-pill fw-bold fs-6">
            🐻 Zustand Tutorial
          </span>
          <span className="badge bg-success-subtle text-white border border-white px-3 py-2 rounded-pill">
            Dành riêng cho dự án Zilo
          </span>
        </div>
        <h1 className="fw-bolder display-6 mb-2">Học & Thực Hành Quản Lý State Với Zustand</h1>
        <p className="fs-6 opacity-90 mb-0" style={{ maxWidth: '800px' }}>
          Zustand là thư viện quản lý trạng thái toàn cục (Global State) cực nhẹ (~1KB), không cần Context Provider bao bọc bên ngoài,
          không boilerplate rườm rà như Redux. Hãy thử tương tác ngay trên trang này để hiểu cách thức hoạt động!
        </p>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI: CÁC BÀI THỰC HÀNH TƯƠNG TÁC */}
        <div className="col-12 col-lg-7">
          {/* PHẦN 1: COUNTER & MESSAGE */}
          <div className="card sh-card border-0 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-1-circle-fill text-success me-2"></i>
                1. State Đơn Giản & Action Đồng Bộ
              </h5>
              <span className="badge bg-light text-dark border">Primitive State</span>
            </div>
            <p className="small text-muted mb-3">
              Minh họa thay đổi biến <code>count</code> và <code>message</code> bằng hàm <code>set()</code>.
            </p>

            <div className="bg-light p-3 rounded-3 mb-3 text-center">
              <div className="text-muted small mb-1">Giá trị hiện tại của count:</div>
              <div className="display-4 fw-bold text-success mb-3">{count}</div>
              <div className="d-flex justify-content-center gap-2">
                <button onClick={decrement} className="btn btn-outline-danger btn-sm px-3 fw-bold">
                  <i className="bi bi-dash-lg"></i> Giảm
                </button>
                <button onClick={increment} className="btn btn-success btn-sm px-3 fw-bold">
                  <i className="bi bi-plus-lg"></i> Tăng
                </button>
                <button onClick={resetCount} className="btn btn-outline-secondary btn-sm px-3">
                  <i className="bi bi-arrow-counterclockwise"></i> Đặt lại
                </button>
              </div>
            </div>

            {/* Đổi message */}
            <div className="border-top pt-3">
              <label className="fw-semibold small text-muted mb-2">Thông điệp hiện tại:</label>
              <div className="alert alert-info py-2 px-3 small mb-2 d-flex align-items-center gap-2">
                <i className="bi bi-chat-quote-fill fs-5 text-info"></i>
                <span className="fw-medium">{message}</span>
              </div>
              <form onSubmit={handleUpdateMsg} className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập thông điệp mới..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                />
                <button className="btn btn-outline-success" type="submit">
                  Đổi thông điệp
                </button>
              </form>
            </div>
          </div>

          {/* PHẦN 2: CRUD ARRAY (DANH SÁCH TODOS) */}
          <div className="card sh-card border-0 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-2-circle-fill text-success me-2"></i>
                2. Quản Lý Mảng Dữ Liệu (Array State)
              </h5>
              <span className="badge bg-light text-dark border">Array CRUD</span>
            </div>
            <p className="small text-muted mb-3">
              Tương tự cách giỏ hàng <code>useCartStore</code> thêm/sửa/xóa sản phẩm.
            </p>

            {/* Form thêm todo */}
            <form onSubmit={handleAddTodo} className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ví dụ: Tích hợp Zustand vào Header..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button className="btn btn-success px-3" type="submit">
                <i className="bi bi-plus-circle me-1"></i> Thêm việc
              </button>
            </form>

            {/* List */}
            <div className="list-group">
              {todos.map((item) => (
                <div
                  key={item.id}
                  className={`list-group-item d-flex justify-content-between align-items-center p-3 ${
                    item.completed ? 'bg-light text-muted' : ''
                  }`}
                >
                  <div className="form-check d-flex align-items-center gap-2 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleTodo(item.id)}
                      id={`todo-${item.id}`}
                    />
                    <label
                      className={`form-check-label small ${item.completed ? 'text-decoration-line-through' : 'fw-medium'}`}
                      htmlFor={`todo-${item.id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.text}
                    </label>
                  </div>
                  <button
                    onClick={() => removeTodo(item.id)}
                    className="btn btn-outline-danger btn-sm border-0"
                    title="Xóa mục này"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN 3: ASYNC ACTIONS (GỌI API) */}
          <div className="card sh-card border-0 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-3-circle-fill text-success me-2"></i>
                3. Async Action (Gọi API Bất Đồng Bộ)
              </h5>
              <span className="badge bg-light text-dark border">Async/Await</span>
            </div>
            <p className="small text-muted mb-3">
              Trong Zustand, chỉ cần viết <code>async () =&gt; &#123; set(&#123; isLoading: true &#125;); ... &#125;</code> mà không cần middleware phức tạp.
            </p>

            <div className="d-flex gap-2 align-items-center">
              <button
                onClick={fetchFakeNotification}
                disabled={isLoading}
                className="btn btn-primary d-flex align-items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Đang gọi API giả lập...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-down-fill"></i>
                    Lấy thông báo mới từ Server
                  </>
                )}
              </button>

              <button onClick={resetAll} className="btn btn-outline-secondary">
                Đặt lại toàn bộ Store
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE STORE INSPECTOR & LÝ THUYẾT */}
        <div className="col-12 col-lg-5">
          {/* LIVE JSON INSPECTOR */}
          <div className="card sh-card border-0 p-3 mb-4 sticky-top" style={{ top: '80px', zIndex: 10 }}>
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <i className="bi bi-cpu-fill text-warning"></i>
                Trạng Thái Thực Tế (Live State)
              </h6>
              <span className="badge bg-success-subtle text-success">Real-time</span>
            </div>
            <p className="small text-muted mb-2">
              Bất kỳ khi nào bạn bấm nút bên trái, JSON dưới đây sẽ lập tức thay đổi:
            </p>
            <pre className="bg-dark text-success p-3 rounded-3 small mb-0" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {JSON.stringify({ count, message, todos, isLoading }, null, 2)}
            </pre>
          </div>

          {/* HƯỚNG DẪN 3 BƯỚC SỬ DỤNG */}
          <div className="card sh-card border-0 p-4 mb-4">
            <h6 className="fw-bold mb-3 text-dark">
              <i className="bi bi-lightbulb-fill text-warning me-2"></i>
              3 Bước Dùng Zustand Trong Dự Án Zilo
            </h6>

            <div className="d-flex flex-column gap-3 small">
              <div className="p-3 bg-light rounded-3">
                <strong className="text-primary d-block mb-1">Bước 1: Tạo Store</strong>
                <code>src/store/useMyStore.ts</code>
                <pre className="bg-white p-2 border rounded mt-2 mb-0" style={{ fontSize: '0.78rem' }}>
{`import { create } from 'zustand';

export const useMyStore = create((set) => ({
  user: null,
  login: (data) => set({ user: data }),
  logout: () => set({ user: null }),
}));`}
                </pre>
              </div>

              <div className="p-3 bg-light rounded-3">
                <strong className="text-primary d-block mb-1">Bước 2: Sử Dụng Trong Component</strong>
                <pre className="bg-white p-2 border rounded mt-2 mb-0" style={{ fontSize: '0.78rem' }}>
{`import { useMyStore } from '../store/useMyStore';

function UserBadge() {
  // Lấy dữ liệu ra dùng
  const user = useMyStore((state) => state.user);
  const logout = useMyStore((state) => state.logout);

  return <div>{user?.name}</div>;
}`}
                </pre>
              </div>

              <div className="p-3 bg-light rounded-3">
                <strong className="text-primary d-block mb-1">Bước 3: Xem các Store thật của dự án:</strong>
                <ul className="mb-0 ps-3">
                  <li><code>useCartStore.ts</code>: Quản lý giỏ hàng, mã giảm giá, tính tổng tiền</li>
                  <li><code>useAuthStore.ts</code>: Lưu thông tin đăng nhập, token, role admin</li>
                  <li><code>useProductStore.ts</code>: Danh sách sản phẩm, danh mục, tìm kiếm</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

