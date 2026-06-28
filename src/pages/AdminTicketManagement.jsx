import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  cancelBooking,
  exchangeBooking,
  getAllBookingsForAdmin,
  updateBookingPaymentStatus,
} from '../utils/bookingsStorage'

export default function AdminTicketManagement() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    setError('')
    try {
      const data = await getAllBookingsForAdmin()
      setBookings(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!isAdmin()) {
      navigate('/', { replace: true })
      return
    }

    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    return bookings.filter((b) => {
      if (query) {
        const matchesId = b.id?.toLowerCase().includes(query)
        const matchesEmail =
          (b.userEmail || b.user?.email || b.userId)?.toLowerCase().includes(query)
        return matchesId || matchesEmail
      }
      if (statusFilter !== 'all' && b.paymentStatus !== statusFilter) return false
      return true
    })
  }, [bookings, statusFilter, searchTerm])

  const revenue = useMemo(() => buildRevenueStats(bookings), [bookings])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Quản lý vé</h1>
        <p className="text-sm text-slate-500 mt-1">Xem vé đã thanh toán, chưa thanh toán và doanh thu hệ thống.</p>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vé đã thanh toán" value={revenue.paidCount} />
        <StatCard label="Doanh thu gộp" value={formatCurrency(revenue.grossRevenue)} />
        <StatCard label="Chiết khấu 10%" value={formatCurrency(revenue.commission)} />
        <StatCard label="Nhà xe nhận" value={formatCurrency(revenue.carrierRevenue)} />
      </section>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 font-semibold">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center flex-1">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-semibold text-sm bg-slate-50"
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Đang xử lý</option>
              <option value="failed">Chưa thanh toán / Thất bại</option>
            </select>
          </div>

          <div className="flex gap-2 items-center flex-1 max-w-lg">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Tìm kiếm:</span>
            <input
              type="text"
              placeholder="Tìm theo Mã vé (Booking ID) hoặc Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-semibold text-sm bg-slate-50"
            />
          </div>
        </div>

        <button
          className="px-4 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-sm font-black text-slate-700 shrink-0"
          onClick={refresh}
        >
          Làm mới
        </button>
      </div>

      {!filtered.length ? (
        <div className="border rounded-2xl bg-white p-8 shadow-sm text-sm text-slate-600">Không có vé phù hợp.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <AdminTicketCard
              key={booking.id}
              booking={booking}
              onMarkPaid={async () => {
                try {
                  await updateBookingPaymentStatus(booking.id, 'paid')
                  refresh()
                } catch (e) {
                  setError(e.message)
                }
              }}
              onCancelBooking={async ({ reason }) => {
                try {
                  await cancelBooking(booking.id, reason)
                  refresh()
                } catch (e) {
                  setError(e.message)
                }
              }}
              onExchangeBooking={async ({ note, toItems }) => {
                try {
                  await exchangeBooking(booking.id, toItems, note)
                  refresh()
                } catch (e) {
                  setError(e.message)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AdminTicketCard({ booking, onMarkPaid, onCancelBooking, onExchangeBooking }) {
  const status = booking.paymentStatus
  const cancelStatus = booking.cancelStatus
  const statusLabel = getStatusLabel(status, cancelStatus)
  const [expanded, setExpanded] = useState(false)
  const [localCancelReason, setLocalCancelReason] = useState(booking.cancelReason || 'Không có')
  const [localExchangeNote, setLocalExchangeNote] = useState('Đổi vé')
  const canCancel = cancelStatus !== 'canceled'
  const canExchange = cancelStatus !== 'canceled'

  return (
    <div className="border rounded-2xl bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-black text-gray-900">Mã vé: #{booking.id}</div>
          <div className="text-xs text-slate-500 mt-1">{formatDateTime(booking.createdAt)}</div>
          <div className="text-sm text-slate-700 mt-2">
            Khách: <span className="font-bold text-slate-900">{booking.user?.email || booking.userEmail || booking.userId}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm font-semibold text-gray-900 sm:grid-cols-3">
            <div>Tổng: {formatCurrency(booking.total)}</div>
            <div>Chiết khấu: {status === 'paid' ? formatCurrency(getCommissionAmount(booking)) : '-'}</div>
            <div>Nhà xe nhận: {status === 'paid' ? formatCurrency(getCarrierRevenue(booking)) : '-'}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`text-xs font-bold px-3 py-1 rounded-full border ${statusLabel.cls}`}>{statusLabel.text}</div>

          <button
            onClick={() => setExpanded((value) => !value)}
            className="px-3 py-2 rounded-xl border hover:bg-slate-50 transition text-sm font-semibold"
          >
            {expanded ? 'Thu gọn' : 'Chi tiết'}
          </button>

          {status !== 'paid' && cancelStatus !== 'canceled' && (
            <button
              onClick={onMarkPaid}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-black hover:bg-green-700 transition shadow"
            >
              Xác nhận đã thanh toán
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onCancelBooking({ reason: localCancelReason })}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700 transition shadow"
            >
              Hủy vé
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(booking.items || []).map((item, index) => (
          <div key={index} className="border rounded-xl p-3 bg-slate-50">
            <div className="text-sm font-bold text-slate-900">{item.title || item.description || item.tripId || 'Chuyến xe'}</div>
            <div className="text-xs text-slate-600 mt-1">
              {formatCurrency(item.price)} x {item.qty || item.seats || 1}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="mt-4 border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border rounded-2xl p-4">
              <div className="font-black text-gray-900 mb-2">Hủy / đổi vé</div>
              <div className="text-sm text-slate-700">
                <div className="mb-2 font-semibold">Lý do hủy</div>
                <input
                  value={localCancelReason}
                  onChange={(event) => setLocalCancelReason(event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div className="mt-3 text-sm text-slate-700">
                <div className="mb-2 font-semibold">Đổi vé</div>
                <input
                  value={localExchangeNote}
                  onChange={(event) => setLocalExchangeNote(event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold"
                />
                <button
                  disabled={!canExchange}
                  onClick={() => onExchangeBooking({ note: localExchangeNote, toItems: booking.items })}
                  className={
                    'mt-3 w-full px-4 py-2 rounded-xl text-white text-sm font-black transition shadow ' +
                    (canExchange ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed')
                  }
                >
                  Đổi vé
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-4">
              <div className="font-black text-gray-900 mb-2">Lịch sử vé đã đặt</div>
              <div className="space-y-2">
                {(booking.history || []).slice().reverse().map((history, index) => (
                  <div key={index} className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
                    <div className="text-sm text-slate-800 font-semibold">{history.type || history.event || 'Cập nhật'}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(history.at || history.timestamp)}</div>
                  </div>
                ))}
                {!booking.history?.length && (
                  <div className="text-sm text-slate-500">Chưa có lịch sử.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
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

function getStatusLabel(status, cancelStatus) {
  if (cancelStatus === 'canceled') return { text: 'Đã hủy', cls: 'bg-gray-100 text-gray-700 border-gray-200' }
  if (status === 'paid') return { text: 'Đã thanh toán', cls: 'bg-green-50 text-green-700 border-green-200' }
  if (status === 'pending') return { text: 'Đang xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { text: 'Chưa thanh toán / Thất bại', cls: 'bg-red-50 text-red-700 border-red-200' }
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
