import { useEffect, useMemo, useState } from 'react'
import adminApi from '../services/adminApi'

export default function AdminRevenue() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await adminApi.getBookings()
      setBookings(response.bookings || [])
    } catch (err) {
      setError(err.message || 'Không thể tải doanh thu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => buildRevenueStats(bookings), [bookings])
  const paidBookings = useMemo(() => bookings.filter((booking) => booking.paymentStatus === 'paid'), [bookings])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Doanh thu</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi doanh thu hệ thống từ các vé đã thanh toán.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vé đã thanh toán" value={stats.paidCount} loading={loading} />
        <StatCard label="Doanh thu gộp" value={formatCurrency(stats.grossRevenue)} loading={loading} />
        <StatCard label="Chiết khấu 10%" value={formatCurrency(stats.commission)} loading={loading} />
        <StatCard label="Nhà xe nhận" value={formatCurrency(stats.carrierRevenue)} loading={loading} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-xl font-black text-slate-900">Chi tiết doanh thu theo vé</h2>
          <button
            className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50"
            onClick={load}
          >
            Làm mới
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Mã vé</th>
                <th className="px-5 py-3">Khách</th>
                <th className="px-5 py-3">Chuyến</th>
                <th className="px-5 py-3">Tổng tiền</th>
                <th className="px-5 py-3">Chiết khấu</th>
                <th className="px-5 py-3">Nhà xe nhận</th>
                <th className="px-5 py-3">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center font-bold text-slate-500">Đang tải...</td></tr>
              ) : paidBookings.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center font-bold text-slate-500">Chưa có vé đã thanh toán</td></tr>
              ) : paidBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-mono text-xs">{booking.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-bold">{booking.user?.fullName || '-'}</div>
                    <div className="text-xs text-slate-500">{booking.user?.email || booking.userEmail || '-'}</div>
                  </td>
                  <td className="px-5 py-4">{booking.trip?.from || '-'} → {booking.trip?.to || '-'}</td>
                  <td className="px-5 py-4 font-black text-red-600">{formatCurrency(booking.total)}</td>
                  <td className="px-5 py-4 font-bold text-slate-700">{formatCurrency(getCommissionAmount(booking))}</td>
                  <td className="px-5 py-4 font-black text-emerald-700">{formatCurrency(getCarrierRevenue(booking))}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDateTime(booking.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN')
}
