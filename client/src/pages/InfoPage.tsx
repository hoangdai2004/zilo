import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

interface InfoSection {
  heading: string;
  body: string;
  links?: { label: string; to: string }[];
}

interface InfoPageContent {
  title: string;
  intro: string;
  sections: InfoSection[];
}

const pages: Record<string, InfoPageContent> = {
  about: {
    title: 'Giới thiệu ShopHub',
    intro: 'ShopHub giúp bạn khám phá sản phẩm, quản lý giỏ hàng và theo dõi đơn mua trên cùng một nền tảng.',
    sections: [
      { heading: 'Mua sắm thuận tiện', body: 'Tìm kiếm và lọc sản phẩm theo danh mục, xem thông tin chi tiết rồi đặt hàng trực tuyến.' },
      { heading: 'Tài khoản của bạn', body: 'Đăng nhập để quản lý đơn hàng, địa chỉ nhận hàng và danh sách yêu thích.', links: [{ label: 'Đăng nhập', to: '/sign-in' }] },
    ],
  },
  careers: {
    title: 'Tuyển dụng',
    intro: 'Chúng tôi mong muốn xây dựng trải nghiệm mua sắm trực tuyến ngày càng tốt hơn.',
    sections: [
      { heading: 'Cơ hội nghề nghiệp', body: 'Hiện chưa có danh sách vị trí tuyển dụng được đăng trên website. Trang này sẽ được cập nhật khi có thông tin tuyển dụng.' },
    ],
  },
  terms: {
    title: 'Điều khoản dịch vụ',
    intro: 'Khi sử dụng ShopHub, vui lòng cung cấp thông tin chính xác và kiểm tra kỹ đơn hàng trước khi xác nhận.',
    sections: [
      { heading: 'Tài khoản và đơn hàng', body: 'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập. Đơn hàng được tạo theo thông tin giao hàng, sản phẩm và phương thức thanh toán đã xác nhận tại bước thanh toán.' },
      { heading: 'Thông tin sản phẩm', body: 'Giá, tồn kho và khả năng cung cấp được hiển thị theo dữ liệu hiện có trên hệ thống và có thể thay đổi trước khi đơn hàng được xác nhận.' },
      { heading: 'Thanh toán', body: 'Hiện tại website hỗ trợ thanh toán khi nhận hàng (COD). Các phương thức thanh toán trực tuyến chưa được kích hoạt.' },
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật',
    intro: 'ShopHub sử dụng thông tin tài khoản và đơn hàng để cung cấp các chức năng mua sắm trên website.',
    sections: [
      { heading: 'Thông tin tài khoản', body: 'Thông tin bạn cung cấp được dùng cho việc đăng nhập, quản lý tài khoản và xử lý các yêu cầu liên quan.' },
      { heading: 'Thông tin đơn hàng', body: 'Tên người nhận, số điện thoại và địa chỉ giao hàng được sử dụng để tạo và quản lý đơn hàng.' },
      { heading: 'Phiên đăng nhập', body: 'Website sử dụng phiên đăng nhập qua cookie do máy chủ quản lý; trình duyệt không lưu bearer token trong localStorage.' },
    ],
  },
  help: {
    title: 'Trung tâm trợ giúp',
    intro: 'Chọn một mục bên dưới để tiếp tục sử dụng các chức năng mua sắm.',
    sections: [
      { heading: 'Tìm sản phẩm', body: 'Duyệt danh mục, tìm theo từ khóa hoặc mở trang chi tiết để xem giá và thông tin sản phẩm.', links: [{ label: 'Xem sản phẩm', to: '/products' }] },
      { heading: 'Đơn hàng và tài khoản', body: 'Đăng nhập để xem đơn hàng và cập nhật thông tin tài khoản.', links: [{ label: 'Đăng nhập', to: '/sign-in' }] },
      { heading: 'Hỗ trợ', body: 'Hotline hiển thị trên website: 1900 6868, từ 8:00 đến 21:00.' },
    ],
  },
  'buying-guide': {
    title: 'Hướng dẫn mua hàng',
    intro: 'Bạn có thể đặt hàng trên ShopHub theo các bước đơn giản sau.',
    sections: [
      { heading: '1. Chọn sản phẩm', body: 'Tìm sản phẩm từ danh mục hoặc thanh tìm kiếm, sau đó xem chi tiết và chọn số lượng phù hợp.', links: [{ label: 'Bắt đầu mua sắm', to: '/products' }] },
      { heading: '2. Kiểm tra giỏ hàng', body: 'Xem lại sản phẩm và số lượng trong giỏ trước khi tiếp tục.' , links: [{ label: 'Mở giỏ hàng', to: '/cart' }] },
      { heading: '3. Điền thông tin và đặt hàng', body: 'Đăng nhập, nhập thông tin nhận hàng và xác nhận đơn hàng. Phương thức hiện được hỗ trợ là thanh toán khi nhận hàng (COD).' },
    ],
  },
  shipping: {
    title: 'Chính sách vận chuyển',
    intro: 'Phí vận chuyển được tính tự động trong quá trình đặt hàng.',
    sections: [
      { heading: 'Phí giao hàng', body: 'Đơn hàng từ 500.000đ được miễn phí vận chuyển. Đơn hàng dưới mức này áp dụng phí 30.000đ theo cấu hình hiện tại.' },
      { heading: 'Theo dõi đơn hàng', body: 'Đăng nhập và mở hồ sơ cá nhân để xem trạng thái các đơn hàng đã đặt.', links: [{ label: 'Đăng nhập', to: '/sign-in' }] },
    ],
  },
  returns: {
    title: 'Chính sách đổi trả',
    intro: 'Thông tin sản phẩm hiện nêu hỗ trợ đổi trả trong 7 ngày đối với lỗi từ nhà sản xuất.',
    sections: [
      { heading: 'Khi cần đổi trả', body: 'Vui lòng giữ lại thông tin đơn hàng và liên hệ bộ phận hỗ trợ qua hotline 1900 6868 (8:00–21:00) để được hướng dẫn.' },
      { heading: 'Yêu cầu trực tuyến', body: 'Hiện website chưa có biểu mẫu gửi yêu cầu đổi trả trực tuyến.' },
    ],
  },
};

export default function InfoPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? pages[slug] : undefined;

  if (!page) return <Navigate to="/" replace />;

  return (
    <div className="container py-4 py-md-5">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{page.title}</li>
        </ol>
      </nav>
      <div className="card sh-card border-0 p-4 p-md-5">
        <div className="mx-auto w-100" style={{ maxWidth: 850 }}>
          <h1 className="h3 fw-bold mb-3">{page.title}</h1>
          <p className="text-muted mb-4">{page.intro}</p>
          <div className="d-flex flex-column gap-4">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="h5 fw-semibold">{section.heading}</h2>
                <p className="text-secondary mb-2">{section.body}</p>
                {section.links?.map((link) => (
                  <Link key={link.to} className="btn btn-sm btn-outline-primary me-2" to={link.to}>{link.label}</Link>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
