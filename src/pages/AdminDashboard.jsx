import { Link } from 'react-router-dom'
import { FaBus, FaCreditCard, FaTicketAlt, FaUsers } from 'react-icons/fa'

const modules = [
  {
    to: '/admin/tickets',
    title: 'Quản lý vé',
    desc: 'Kiểm tra booking, trạng thái thanh toán, hủy và đổi vé.',
    icon: FaTicketAlt,
    color: 'bg-red-50 text-red-600 border-red-100',
  },
  {
    to: '/admin/payments',
    title: 'Thanh toán',
    desc: 'Xác nhận hoặc từ chối các giao dịch chuyển khoản.',
    icon: FaCreditCard,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    to: '/admin/users',
    title: 'Người dùng',
    desc: 'Xem, sửa tài khoản và phân quyền người dùng.',
    icon: FaUsers,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    to: '/admin/carriers',
    title: 'Nhà xe',
    desc: 'Quản lý nhà xe, duyệt thông tin và trạng thái hoạt động.',
    icon: FaBus,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-red-600">Dashboard</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Tổng quan quản trị</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
              Đây là khu vực riêng cho admin để theo dõi vé, thanh toán, người dùng và nhà xe.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Xem trang khách hàng
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${item.color}`}>
                <Icon className="text-xl" />
              </div>
              <h2 className="text-lg font-black text-slate-950 group-hover:text-red-600">{item.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.desc}</p>
            </Link>
          )
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Tác vụ nhanh</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
