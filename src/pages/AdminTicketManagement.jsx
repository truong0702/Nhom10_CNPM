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
  const [error, setError] = useState('')

  const [cancelReason, setCancelReason] = useState('Không có')
  const [exchangeNote, setExchangeNote] = useState('Đổi lịch')


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
    if (statusFilter === 'all') return bookings
    return bookings.filter((b) => b.paymentStatus === statusFilter)
  }, [bookings, statusFilter])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Quản lý vé</h1>
        <p className="text-sm text-slate-500 mt-1">Xem vé đã thanh toán / chưa thanh toán</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 font-semibold">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-bold text-slate-700">Lọc trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold bg-white"
          >
            <option value="all">Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Đang xử lý</option>
            <option value="failed">Chưa thanh toán / Thất bại</option>
          </select>
        </div>

        <button
          className="px-4 py-2 rounded-xl border hover:bg-slate-50 transition text-sm font-semibold"
          onClick={refresh}
        >
          Làm mới
        </button>
      </div>

      {!filtered.length ? (
        <div className="border rounded-2xl bg-white p-8 shadow-sm text-sm text-slate-600">Không có vé phù hợp.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <AdminTicketCard
              key={b.id}
              booking={b}
              onMarkPaid={async () => {
                try {
                  await updateBookingPaymentStatus(b.id, 'paid')
                  refresh()
                } catch (e) {
                  setError(e.message)
                }
              }}
              onCancelBooking={async ({ reason }) => {
                try {
                  await cancelBooking(b.id, reason)
                  refresh()
                } catch (e) {
                  setError(e.message)
                }
              }}
              onExchangeBooking={async ({ note, toItems }) => {
                try {
                  await exchangeBooking(b.id, toItems, note)
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

  const statusLabel =
    cancelStatus === 'canceled'
      ? { text: 'Đã hủy', cls: 'bg-gray-100 text-gray-700 border-gray-200' }
      : status === 'paid'
        ? { text: 'Đã thanh toán', cls: 'bg-green-50 text-green-700 border-green-200' }
        : status === 'pending'
          ? { text: 'Đang xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
          : { text: 'Chưa thanh toán / Thất bại', cls: 'bg-red-50 text-red-700 border-red-200' }

  const [expanded, setExpanded] = useState(false)
  const [localCancelReason, setLocalCancelReason] = useState(cancelReasonDefaults(booking))
  const [localExchangeNote, setLocalExchangeNote] = useState('Đổi vé')

  function cancelReasonDefaults(b) {
    return b.cancelReason || 'Không có'
  }

  const canCancel = cancelStatus !== 'canceled'
  const canExchange = cancelStatus !== 'canceled'

  return (
    <div className="border rounded-2xl bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-black text-gray-900">Mã vé: #{booking.id}</div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(booking.createdAt).toLocaleString('vi-VN')}
          </div>
          <div className="text-sm text-slate-700 mt-2">
            Khách: <span className="font-bold text-slate-900">{booking.userEmail || booking.userId}</span>
          </div>
          <div className="text-sm font-semibold text-gray-900 mt-3">
            Tổng: {Number(booking.total).toLocaleString('vi-VN')}đ
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`text-xs font-bold px-3 py-1 rounded-full border ${statusLabel.cls}`}>{statusLabel.text}</div>

          <div className="flex gap-2">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-3 py-2 rounded-xl border hover:bg-slate-50 transition text-sm font-semibold"
            >
              {expanded ? 'Thu gọn' : 'Chi tiết'}
            </button>
          </div>

          <div className="flex flex-col items-end gap-2">
            {status !== 'paid' && cancelStatus !== 'canceled' && (
              <button
                onClick={onMarkPaid}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-black hover:bg-green-700 transition shadow"
              >
                Xác nhận đã thanh toán
              </button>
            )}

            {canCancel && (
              <div className="w-full">
                <button
                  onClick={() =>
                    onCancelBooking({ reason: localCancelReason })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700 transition shadow"
                >
                  Hủy vé
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(booking.items || []).map((it, idx) => (
          <div key={idx} className="border rounded-xl p-3 bg-slate-50">
            <div className="text-sm font-bold text-slate-900">{it.title || it.description || it.tripId || 'Chuyến xe'}</div>
            <div className="text-xs text-slate-600 mt-1">
              {Number(it.price).toLocaleString('vi-VN')}đ × {it.qty}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="mt-4 border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border rounded-2xl p-4">
              <div className="font-black text-gray-900 mb-2">Hủy / đổi / lịch sử</div>
              <div className="text-sm text-slate-700">
                <div className="mb-2 font-semibold">Lý do hủy</div>
                <input
                  value={localCancelReason}
                  onChange={(e) => setLocalCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div className="mt-3 text-sm text-slate-700">
                <div className="mb-2 font-semibold">Đổi vé</div>
                <input
                  value={localExchangeNote}
                  onChange={(e) => setLocalExchangeNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold"
                />
                <button
                  disabled={!canExchange}
                  onClick={() =>
                    onExchangeBooking({
                      note: localExchangeNote,
                      toItems: booking.items,
                    })
                  }
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
              <div className="text-xs text-slate-500 mb-2">(event list)</div>
              <div className="space-y-2">
                {(booking.history || []).slice().reverse().map((h, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
                    <div className="text-sm text-slate-800 font-semibold">{h.type || h.event || 'Cập nhật'}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(h.at || h.timestamp)}</div>
                  </div>
                ))}
                {!booking.history?.length && (
                  <div className="text-sm text-slate-500">Chưa có lịch sử.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <div className="font-black text-gray-900 mb-2">Danh sách vé đã đặt</div>
            <div className="text-sm text-slate-700">
              <div className="mb-2">Trạng thái: <span className="font-bold">{statusLabel.text}</span></div>
              <div className="space-y-2">
                {(booking.exchanges || []).length ? (
                  booking.exchanges.map((ex, idx) => (
                    <div key={idx} className="border rounded-xl p-3 bg-slate-50">
                      <div className="text-xs text-slate-500">{formatDateTime(ex.at || ex.timestamp)}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">Đổi vé</div>
                      <div className="text-xs text-slate-600 mt-1">Ghi chú: {ex.note || '-'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">Chưa có lần đổi vé.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN')
}


