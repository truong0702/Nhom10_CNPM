import { Link } from 'react-router-dom'
import { FaBus, FaEnvelope, FaFacebook, FaInstagram, FaPhone, FaTwitter } from 'react-icons/fa'

const aboutLinks = [
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Tuyển dụng', to: '/careers' },
  { label: 'Blog', to: '/blog' },
]

const supportLinks = [
  { label: 'Liên hệ', to: '/contact' },
  { label: 'Câu hỏi thường gặp', to: '/faq' },
  { label: 'Chính sách', to: '/policy' },
]

const appLinks = [
  { label: 'iOS', to: '/policy' },
  { label: 'Android', to: '/policy' },
  { label: 'Web', to: '/' },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-red-500/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10 grid grid-cols-1 items-start gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-950/30">
                <FaBus className="text-2xl" />
              </div>
              <div>
                <div className="text-2xl font-black">Vexere</div>
                <div className="text-xs font-semibold text-slate-400">Đặt vé xe online</div>
              </div>
            </div>
            <p className="text-sm font-semibold leading-6 text-slate-300">
              Nền tảng đặt vé xe trực tuyến giúp khách hàng tìm chuyến, chọn ghế và theo dõi vé rõ ràng hơn.
            </p>

            <div className="mt-5 flex gap-3">
              <SocialIcon label="Facebook" icon={<FaFacebook />} />
              <SocialIcon label="Instagram" icon={<FaInstagram />} />
              <SocialIcon label="Twitter" icon={<FaTwitter />} />
            </div>
          </div>

          <FooterColumn title="Về Vexere" links={aboutLinks} />
          <FooterColumn title="Hỗ trợ" links={supportLinks} />
          <FooterColumn title="Tải app" links={appLinks} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
            <ContactItem icon={<FaPhone />} label="Hotline" value="1900 1000" />
            <ContactItem icon={<FaEnvelope />} label="Email" value="nqtruong7722@gmail.com" />
            <div className="text-sm font-semibold leading-6 text-slate-300 md:text-right">
              © 2026 Vexere. Mọi quyền được bảo lưu.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div className="min-w-0">
      <h5 className="mb-4 text-base font-black text-white">{title}</h5>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-sm font-semibold text-slate-400 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-200">
        {icon}
      </div>
      <div>
        <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-sm font-black text-white">{value}</div>
      </div>
    </div>
  )
}

function SocialIcon({ icon, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-red-600"
    >
      {icon}
    </button>
  )
}
