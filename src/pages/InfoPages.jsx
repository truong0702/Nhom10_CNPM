import { Link } from 'react-router-dom'
import {
  FaArrowRight,
  FaBriefcase,
  FaBus,
  FaEnvelope,
  FaFileAlt,
  FaQuestionCircle,
  FaRss,
  FaRoute,
} from 'react-icons/fa'
import { HERO_BG } from '../components/SearchForm'

const pages = {
  about: {
    icon: FaBus,
    eyebrow: 'Về Vexere',
    title: 'Giới thiệu',
    intro: 'Vexere là nền tảng đặt vé xe trực tuyến giúp khách hàng tìm chuyến, so sánh giá, chọn ghế và theo dõi vé trong một luồng rõ ràng.',
    stats: [
      ['3 bước', 'Tìm chuyến, chọn ghế, thanh toán'],
      ['24h', 'Theo dõi trạng thái vé'],
      ['10%', 'Phí hủy minh bạch'],
    ],
    sections: [
      {
        title: 'Chúng tôi làm gì',
        body: 'Kết nối khách hàng với các nhà xe, hiển thị thông tin chuyến đi, giá vé, ghế trống và trạng thái thanh toán minh bạch.',
      },
      {
        title: 'Mục tiêu',
        body: 'Tạo trải nghiệm đặt vé nhanh hơn, ít thao tác hơn và dễ kiểm tra hơn cho cả khách hàng lẫn bộ phận quản trị.',
      },
    ],
  },
  careers: {
    icon: FaBriefcase,
    eyebrow: 'Cơ hội nghề nghiệp',
    title: 'Tuyển dụng',
    intro: 'Vexere tìm kiếm những người muốn xây dựng sản phẩm đặt vé xe ổn định, dễ dùng và phục vụ nhu cầu di chuyển hằng ngày.',
    stats: [
      ['Vận hành', 'Tuyến xe và nhà xe'],
      ['Sản phẩm', 'Giao diện đặt vé'],
      ['Hỗ trợ', 'Chăm sóc khách hàng'],
    ],
    sections: [
      {
        title: 'Vị trí đang mở',
        body: 'Chăm sóc khách hàng, vận hành nhà xe, phát triển sản phẩm, kiểm thử hệ thống và quản trị dữ liệu chuyến xe.',
      },
      {
        title: 'Cách ứng tuyển',
        body: 'Gửi hồ sơ và vị trí mong muốn về email nqtruong7722@gmail.com. Đội ngũ tuyển dụng sẽ phản hồi khi hồ sơ phù hợp.',
      },
    ],
  },
  blog: {
    icon: FaRss,
    eyebrow: 'Tin tức',
    title: 'Blog',
    intro: 'Cập nhật kinh nghiệm đi xe, hướng dẫn đặt vé và các thông tin hữu ích cho hành khách.',
    stats: [
      ['Mẹo đi xe', 'Chuẩn bị trước hành trình'],
      ['Hướng dẫn', 'Đặt vé và thanh toán'],
      ['Cập nhật', 'Thông tin tuyến đường'],
    ],
    sections: [
      {
        title: 'Hướng dẫn đặt vé online',
        body: 'Chọn tuyến đường, ngày đi, số khách, sau đó so sánh chuyến xe và chọn ghế phù hợp trước khi thanh toán.',
      },
      {
        title: 'Mẹo chọn chuyến xe',
        body: 'Nên kiểm tra giờ khởi hành, thời gian di chuyển, ghế còn trống, đánh giá và chính sách hủy vé trước khi đặt.',
      },
    ],
  },
  contact: {
    icon: FaEnvelope,
    eyebrow: 'Hỗ trợ khách hàng',
    title: 'Liên hệ',
    intro: 'Bạn có thể liên hệ Vexere khi cần hỗ trợ đặt vé, thanh toán, đổi vé, hủy vé hoặc kiểm tra thông tin chuyến xe.',
    stats: [
      ['1900 1000', 'Hotline hỗ trợ'],
      ['08:00 - 22:00', 'Thời gian làm việc'],
      ['Email', 'nqtruong7722@gmail.com'],
    ],
    sections: [
      {
        title: 'Thông tin liên hệ',
        body: 'Hotline: 1900 1000. Email: nqtruong7722@gmail.com. Thời gian hỗ trợ: 08:00 - 22:00 mỗi ngày.',
      },
      {
        title: 'Khi cần hỗ trợ vé',
        body: 'Vui lòng cung cấp mã booking, email đặt vé và tuyến đường để đội ngũ hỗ trợ kiểm tra nhanh hơn.',
      },
    ],
  },
  faq: {
    icon: FaQuestionCircle,
    eyebrow: 'Trợ giúp',
    title: 'Câu hỏi thường gặp',
    intro: 'Các câu hỏi phổ biến khi tìm chuyến, đặt vé, thanh toán, đổi vé và hủy vé.',
    stats: [
      ['Hủy vé', 'Hoàn tiền qua ví'],
      ['Đổi vé', 'Tính phí minh bạch'],
      ['Thanh toán', 'Admin xác nhận'],
    ],
    sections: [
      {
        title: 'Tôi có thể hủy vé không?',
        body: 'Có. Vé có thể được hủy trong trang Đặt vé của tôi nếu còn đủ điều kiện. Hệ thống sẽ tính phí hủy và hoàn phần còn lại vào ví.',
      },
      {
        title: 'Thanh toán chuyển khoản được xác nhận như thế nào?',
        body: 'Sau khi tạo thanh toán chuyển khoản, admin sẽ kiểm tra giao dịch và xác nhận hoặc từ chối trong trang quản lý thanh toán.',
      },
      {
        title: 'Tôi có thể đổi chuyến không?',
        body: 'Có. Chức năng đổi vé sẽ tính phí đổi và xử lý phần chênh lệch giá qua ví người dùng.',
      },
    ],
  },
  policy: {
    icon: FaFileAlt,
    eyebrow: 'Điều khoản dịch vụ',
    title: 'Chính sách',
    intro: 'Các chính sách cơ bản về đặt vé, thanh toán, hủy vé, đổi vé và bảo vệ thông tin người dùng.',
    stats: [
      ['Thanh toán', 'Đúng số tiền booking'],
      ['Hủy/đổi', 'Có thể phát sinh phí'],
      ['Bảo mật', 'Dữ liệu dùng cho đặt vé'],
    ],
    sections: [
      {
        title: 'Chính sách thanh toán',
        body: 'Khách hàng cần hoàn tất thanh toán đúng số tiền booking. Với chuyển khoản ngân hàng, thanh toán chỉ có hiệu lực sau khi được xác nhận.',
      },
      {
        title: 'Chính sách hủy và đổi vé',
        body: 'Hủy vé có thể phát sinh phí. Đổi vé có thể phát sinh phí đổi và chênh lệch giá tùy chuyến mới.',
      },
      {
        title: 'Bảo mật thông tin',
        body: 'Thông tin tài khoản, vé và thanh toán được dùng để xử lý dịch vụ đặt vé và hỗ trợ khách hàng.',
      },
    ],
  },
}

export function AboutPage() {
  return <InfoPage data={pages.about} />
}

export function CareersPage() {
  return <InfoPage data={pages.careers} />
}

export function BlogPage() {
  return <InfoPage data={pages.blog} />
}

export function ContactPage() {
  return <InfoPage data={pages.contact} />
}

export function FaqPage() {
  return <InfoPage data={pages.faq} />
}

export function PolicyPage() {
  return <InfoPage data={pages.policy} />
}

function InfoPage({ data }) {
  const Icon = data.icon

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: HERO_BG, backgroundSize: 'cover', backgroundPosition: 'center top' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(239,68,68,0.20),transparent_30%),radial-gradient(circle_at_15%_85%,rgba(14,165,233,0.18),transparent_28%)]" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl grid-cols-1 gap-8 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl text-white ring-1 ring-white/20 backdrop-blur">
              <Icon />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-wide text-red-300">{data.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-5xl font-black leading-tight text-white">{data.title}</h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-200">{data.intro}</p>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {data.stats.map(([value, label]) => (
                <div key={value} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="mt-1 text-xs font-bold text-slate-300">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/25 backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-300">Tuyến nổi bật</div>
                <div className="mt-1 text-xl font-black text-white">Hà Nội → Đà Nẵng</div>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                Còn ghế
              </span>
            </div>

            <div className="relative h-40 overflow-hidden rounded-2xl bg-slate-900/70">
              <div className="absolute left-8 right-8 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/20" />
              <div className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-white/50" />
              <RoutePin label="Hà Nội" className="left-6" />
              <RoutePin label="Đà Nẵng" className="right-6 flex-row-reverse text-right" />
              <div className="route-bus absolute top-1/2 -translate-y-1/2">
                <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-red-500 text-white shadow-xl shadow-red-950/40">
                  <FaBus className="text-3xl" />
                </div>
              </div>
              <div className="road-light road-light-1" />
              <div className="road-light road-light-2" />
              <div className="road-light road-light-3" />
            </div>

            <Link
              to="/"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-950/30 hover:bg-red-700"
            >
              Tìm chuyến ngay
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative -mt-px overflow-hidden bg-slate-950 px-4 py-14">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white">
              <FaRoute />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-300">Thông tin liên quan</p>
              <h2 className="text-2xl font-black text-white">{data.title}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {data.sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <h3 className="text-xl font-black text-white">{section.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function RoutePin({ label, className }) {
  return (
    <div className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-lg">
        <FaRoute />
      </div>
      <div className="text-xs font-black text-white">{label}</div>
    </div>
  )
}
