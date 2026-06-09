import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  cancelBooking,
  exchangeBooking,
  getBookingsByUser,
} from '../utils/bookingsStorage'
import { walletApi } from '../services/walletApi'
import ExchangeTicketModal from '../components/ExchangeTicketModal'

export default function MyTickets() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [bookings, setBookings] = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [error, setError] = useState('')
  const [busyBookingId, setBusyBookingId] = useState(null)
  const [exchangingBookingId, setExchangingBookingId] = useState(null)

  const refresh = async () => {
    setError('')
    if (!user) return

    try {
      setBookings(await getBookingsByUser(user.id))
      const wallet = await walletApi.getBalance()
      setWalletBalance(Number(wallet?.balance ?? wallet ?? 0))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate])

  const grouped = useMemo(() => {
    const verified = bookings.filter((b) => b.payment?.status === 'verified' || b.paymentStatus === 'paid')
    const pending = bookings.filter((b) => b.payment?.status === 'pending')
    const failed = bookings.filter((b) => b.payment?.status === 'failed' || (b.paymentStatus === 'failed' && !b.payment))
    return { verified, pending, failed }
  }, [bookings])

  const exchangingBooking = useMemo(
    () => bookings.find((b) => b.id === exchangingBookingId),
    [bookings, exchangingBookingId]
  )

  if (!user) return null

  const canInteract = (booking) => {
    const isPaid = booking.payment?.status === 'verified' || booking.paymentStatus === 'paid'
    const isNotCanceled = booking.cancelStatus !== 'canceled'
    return isPaid && isNotCanceled
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Vé của tôi</h1>
        <p className="mt-1 text-sm text-slate-500">Xem các vé bạn đã đặt và trạng thái thanh toán</p>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm text-blue-700">Số dư ví</div>
        <div className="mt-1 text-2xl font-black text-blue-900">{formatCurrency(walletBalance)}</div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
          {error}
        </div>
      )}

      {!bookings.length ? (
        <div className="rounded-2xl border bg-white p-8 text-sm text-slate-600 shadow-sm">
          Bạn chưa có vé nào. Hãy đặt chuyến trước khi xem vé.
        </div>
      ) : (
        <div className="space-y-6">
          <Section title={`Đã xác nhận (${grouped.verified.length})`}>
            {grouped.verified.length ? (
              grouped.verified.map((booking) => (
                <TicketCard
                  key={booking.id}
                  booking={booking}
                  canInteract={canInteract(booking)}
                  busy={busyBookingId === booking.id}
                  onCancel={async ({ reason }) => {
                    setBusyBookingId(booking.id)
                    setError('')
                    try {
                      await cancelBooking(booking.id, reason)
                      await refresh()
                    } catch (e) {
                      setError(e.message)
                    } finally {
                      setBusyBookingId(null)
                    }
                  }}
                  onExchange={() => setExchangingBookingId(booking.id)}
                />
              ))
            ) : (
              <Empty />
            )}
          </Section>

          <Section title={`Chờ xác nhận thanh toán (${grouped.pending.length})`}>
            {grouped.pending.length ? (
              grouped.pending.map((booking) => (
                <TicketCard
                  key={booking.id}
                  booking={booking}
                  canInteract={false}
                  busy={false}
                  onCancel={async () => {}}
                  onExchange={() => {}}
                />
              ))
            ) : (
              <Empty />
            )}
          </Section>

          <Section title={`Thanh toán thất bại (${grouped.failed.length})`}>
            {grouped.failed.length ? (
              grouped.failed.map((booking) => (
                <TicketCard
                  key={booking.id}
                  booking={booking}
                  canInteract={false}
                  busy={false}
                  onCancel={async () => {}}
                  onExchange={() => {}}
                />
              ))
            ) : (
              <Empty />
            )}
          </Section>
        </div>
      )}

      {exchangingBooking && (
        <ExchangeTicketModal
          booking={exchangingBooking}
          loading={busyBookingId === exchangingBooking.id}
          onCancel={() => setExchangingBookingId(null)}
          onConfirm={async ({ toItems, note }) => {
            setBusyBookingId(exchangingBooking.id)
            setError('')
            try {
              await exchangeBooking(exchangingBooking.id, toItems, note)
              await refresh()
              setExchangingBookingId(null)
            } catch (e) {
              setError(e.message)
            } finally {
              setBusyBookingId(null)
            }
          }}
        />
      )}

      <div className="mt-8 text-xs text-slate-400">
        Phí hủy vé: 10%, phí đổi vé: 5%
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 font-black text-gray-900">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Empty() {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
      Trống
    </div>
  )
}

function TicketCard({ booking, canInteract, busy, onCancel, onExchange }) {
  const [expanded, setExpanded] = useState(false)
  const [localCancelReason, setLocalCancelReason] = useState(booking.cancelReason || 'Không hài lòng với chuyến đi')

  const isCanceled = booking.cancelStatus === 'canceled'
  const statusLabel = getStatusLabel(booking)
  const cancelFee = Math.round(Number(booking.total || 0) * 0.1)
  const cancelRefund = Number(booking.total || 0) - cancelFee
  const exchangeFee = Math.round(Number(booking.total || 0) * 0.05)

  return (
    <div className={`rounded-xl border p-4 ${isCanceled ? 'bg-red-50' : 'bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-gray-900">Mã vé: #{booking.id}</div>
          <div className="mt-1 text-xs text-slate-500">{formatDateTime(booking.createdAt)}</div>
          {isCanceled && (
            <div className="mt-2 text-xs font-semibold text-red-600">
              Vé đã hủy lúc {formatDateTime(booking.canceledAt)}
            </div>
          )}
          <div className="mt-3 text-sm font-semibold text-gray-900">
            Tổng: {formatCurrency(booking.total)}
          </div>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-bold ${statusLabel.cls}`}>
          {statusLabel.text}
        </div>
      </div>

      {booking.payment?.status === 'pending' && (
        <Notice tone="amber" title="Chờ xác nhận thanh toán">
          Thanh toán của bạn đã được ghi nhận. Admin sẽ xác nhận trong vòng 24h.
          Bạn sẽ không thể hủy/đổi vé cho tới khi thanh toán được xác nhận.
          {booking.payment?.createdAt && (
            <div className="mt-2">Thời gian thanh toán: {formatDateTime(booking.payment.createdAt)}</div>
          )}
        </Notice>
      )}

      {booking.payment?.status === 'failed' && (
        <Notice tone="red" title="Thanh toán thất bại">
          Thanh toán của bạn đã bị từ chối. Vui lòng liên hệ admin hoặc thử lại.
        </Notice>
      )}

      <div className="mt-3 space-y-2">
        {(booking.items || []).map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-sm">
            <div className="text-slate-700">{item.title || item.description || item.tripId || 'Chuyến xe'}</div>
            <div className="font-semibold text-slate-900">
              {formatCurrency(item.price)} x {item.qty || item.seats || 1}
            </div>
          </div>
        ))}
      </div>

      {(canInteract || expanded) && !isCanceled && (
        <div className="mt-4">
          {!canInteract && booking.payment?.status === 'pending' && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Vui lòng chờ admin xác nhận thanh toán trước khi hủy/đổi vé.
            </div>
          )}

          <button
            className={`text-sm font-semibold ${canInteract ? 'text-indigo-700 hover:text-indigo-800' : 'cursor-not-allowed text-gray-400'}`}
            onClick={() => setExpanded((value) => !value)}
            type="button"
            disabled={!canInteract}
          >
            {expanded ? 'Thu gọn' : 'Hủy / Đổi vé'}
          </button>

          {expanded && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-red-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-gray-900">Hủy vé</div>
                <div className="mb-3 space-y-1 rounded-lg border border-red-100 bg-red-50 p-3 text-xs">
                  <PriceRow label="Giá vé" value={booking.total} />
                  <PriceRow label="Phí hủy (10%)" value={-cancelFee} tone="red" />
                  <PriceRow label="Hoàn lại" value={cancelRefund} tone="green" strong />
                </div>
                <input
                  placeholder="Lý do hủy vé..."
                  value={localCancelReason}
                  onChange={(e) => setLocalCancelReason(e.target.value)}
                  className="mb-3 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  disabled={!canInteract || busy}
                />
                <button
                  disabled={!canInteract || busy}
                  onClick={() => onCancel({ reason: localCancelReason })}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-bold text-white shadow transition ${
                    !canInteract || busy ? 'cursor-not-allowed bg-red-300' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {busy ? 'Đang xử lý...' : 'Xác nhận hủy vé'}
                </button>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-gray-900">Đổi vé</div>
                <div className="mb-3 space-y-1 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs">
                  <PriceRow label="Giá vé hiện tại" value={booking.total} />
                  <PriceRow label="Phí đổi vé (5%)" value={-exchangeFee} tone="indigo" />
                  <div className="border-t border-indigo-200 pt-1 text-slate-600">
                    Chọn vé mới rồi nhập ghi chú để xác nhận đổi.
                  </div>
                </div>
                <button
                  disabled={!canInteract || busy}
                  onClick={onExchange}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-bold text-white shadow transition ${
                    !canInteract || busy ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {busy ? 'Đang xử lý...' : 'Mở form đổi vé'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isCanceled && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="mb-2 text-xs font-semibold text-red-700">Lý do hủy:</div>
          <div className="text-sm text-red-700">{booking.cancelReason || 'Không có ghi chú'}</div>
        </div>
      )}

      {booking.exchanges?.length > 0 && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="mb-2 text-xs font-semibold text-blue-700">Lịch sử đổi vé:</div>
          {booking.exchanges.map((exchange, index) => (
            <div key={index} className="mb-2 text-xs text-blue-700">
              <div>Lần {index + 1}: {formatDateTime(exchange.timestamp || exchange.at)}</div>
              <div className="ml-2 text-blue-600">
                {exchange.reason || exchange.note || describeExchange(exchange)} (Phí: {formatCurrency(exchange.exchangeFee || 0)})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Notice({ tone, title, children }) {
  const cls = tone === 'red'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <div className={`mt-3 rounded-lg border p-3 text-xs ${cls}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function PriceRow({ label, value, tone = 'default', strong = false }) {
  const color =
    tone === 'red' ? 'text-red-700' :
    tone === 'green' ? 'text-green-700' :
    tone === 'indigo' ? 'text-indigo-700' :
    'text-slate-700'

  return (
    <div className={`flex justify-between ${color} ${strong ? 'border-t border-red-200 pt-1 font-bold' : 'font-semibold'}`}>
      <span>{label}:</span>
      <span>{formatCurrency(value)}</span>
    </div>
  )
}

function getStatusLabel(booking) {
  if (booking.payment) {
    if (booking.payment.status === 'verified') {
      return { text: 'Đã thanh toán', cls: 'border-green-200 bg-green-50 text-green-700' }
    }
    if (booking.payment.status === 'pending') {
      return { text: 'Chờ xác nhận thanh toán', cls: 'border-amber-200 bg-amber-50 text-amber-700' }
    }
    if (booking.payment.status === 'failed') {
      return { text: 'Thanh toán thất bại', cls: 'border-red-200 bg-red-50 text-red-700' }
    }
  }

  if (booking.paymentStatus === 'paid') {
    return { text: 'Đã thanh toán', cls: 'border-green-200 bg-green-50 text-green-700' }
  }
  if (booking.paymentStatus === 'processing' || booking.paymentStatus === 'pending') {
    return { text: 'Đang xử lý', cls: 'border-amber-200 bg-amber-50 text-amber-700' }
  }
  return { text: 'Chưa thanh toán', cls: 'border-red-200 bg-red-50 text-red-700' }
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN')
}

function describeExchange(exchange = {}) {
  const fromRoute = exchange.from?.route
  const toRoute = exchange.to?.route
  if (fromRoute && toRoute) return `${fromRoute} → ${toRoute}`
  return 'Đổi vé'
}
