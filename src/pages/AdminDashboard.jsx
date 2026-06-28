import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBus, FaCreditCard, FaTicketAlt, FaUsers } from 'react-icons/fa'
import adminApi from '../services/adminApi'

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
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        setLoading(true)
        const response = await adminApi.getBookings()
        setBookings(response.bookings || [])
      } catch {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    loadRevenue()
  }, [])

  const revenue = useMemo(() => buildRevenueStats(bookings), [bookings])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-red-600">Dashboard</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Tổng quan quản trị</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
              Theo dõi vé, thanh toán, người dùng, nhà xe và doanh thu hệ thống.
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
        <StatCard label="Vé đã thanh toán" value={revenue.paidCount} loading={loading} />
        <StatCard label="Doanh thu gộp" value={formatCurrency(revenue.grossRevenue)} loading={loading} />
        <StatCard label="Chiết khấu hệ thống" value={formatCurrency(revenue.commission)} loading={loading} />
        <StatCard label="Nhà xe nhận" value={formatCurrency(revenue.carrierRevenue)} loading={loading} />
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

function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-950">{loading ? '-' : value}</div>
    </div>
  )
}

function buildRevenueStats(bookings) {
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'paid')
  const grossRevenue = paidBookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0)
  const commission = paidBookings.reduce((sum, booking) => sum + getCommissionAmount(booking), 0)
  const carrierRevenue = paidBookings.reduce((sum, booking) => sum + getCarrierRevenue(booking), 0)
  return {
    paidCount: paidBookings.length,
    grossRevenue,
    commission,
    carrierRevenue,
  }
}

function getCommissionAmount(booking) {
  if (booking.paymentStatus !== 'paid') return 0
  const total = Number(booking.total || 0)
  return Number(booking.commissionAmount || Math.round(total * 0.1))
}

function getCarrierRevenue(booking) {
  if (booking.paymentStatus !== 'paid') return 0
  const total = Number(booking.total || 0)
  return Number(booking.carrierRevenue || Math.max(total - getCommissionAmount(booking), 0))
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}
