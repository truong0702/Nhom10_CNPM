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
      setWalletBalance(wallet?.balance ?? wallet ?? 0)
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
    const paid = bookings.filter((b) => b.paymentStatus === 'paid')
    const others = bookings.filter((b) => b.paymentStatus !== 'paid')
    return { paid, others }
  }, [bookings])

  const canInteract = (booking) => {
    // Chỉ cho hủy/đổi nếu đã thanh toán và booking chưa hủy
    return booking.paymentStatus === 'paid' && booking.cancelStatus !== 'canceled'
  }

  const exchangingBooking = useMemo(
    () => bookings.find((b) => b.id === exchangingBookingId),
    [bookings, exchangingBookingId]
  )

  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Vé của tôi</h1>
        <p className="text-sm text-slate-500 mt-1">Xem các vé bạn đã đặt và trạng thái thanh toán</p>
      </div>

      {/* Wallet Balance */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="text-sm text-blue-700">Số dư ví</div>
        <div className="text-2xl font-black text-blue-900 mt-1">
          {walletBalance.toLocaleString('vi-VN')}đ
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 font-semibold">
          {error}
        </div>
      )}

      {!bookings.length ? (
        <div className="border rounded-2xl bg-white p-8 shadow-sm text-sm text-slate-600">
          Bạn chưa có vé nào. Hãy đặt chuyến trước khi xem vé.
        </div>
      ) : (
        <div className="space-y-6">
          <Section title={`Đã thanh toán (${grouped.paid.length})`}>
            {grouped.paid.length ? (
              grouped.paid.map((b) => (
                <TicketCard
                  key={b.id}
                  booking={b}
                  canInteract={canInteract(b)}
                  busy={busyBookingId === b.id}
                  onCancel={async ({ reason }) => {
                    setBusyBookingId(b.id)
                    setError('')
                    try {
                      await cancelBooking(b.id, reason)
                      refresh()
                    } catch (e) {
                      setError(e.message)
                    } finally {
                      setBusyBookingId(null)
                    }
                  }}
                  onExchange={() => {
                    setExchangingBookingId(b.id)
                  }}
                />
              ))
            ) : (
              <Empty />
            )}
          </Section>

          <Section title={`Chưa thanh toán / Thất bại (${grouped.others.length})`}>
            {grouped.others.length ? (
              grouped.others.map((b) => (
                <TicketCard
                  key={b.id}
                  booking={b}
                  canInteract={canInteract(b)}
                  busy={busyBookingId === b.id}
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

      {/* Exchange Modal */}
      {exchangingBooking && (
        <ExchangeTicketModal
          booking={exchangingBooking}
          loading={busyBookingId === exchangingBooking.id}
          onCancel={() => setExchangingBookingId(null)}
          onConfirm={async ({ toItems, note }) => {
            setBusyBookingId(exchangingBooking.id)
            setError('')
            try {
              await exchangeBooking(exchangingBooking.id, { toItems, note })
              refresh()
              setExchangingBookingId(null)
            } catch (e) {
              setError(e.message)
            } finally {
              setBusyBookingId(null)
            }
          }}
        />
      )}

      {/* convenience */}
      <div className="mt-8 text-xs text-slate-400">
        Phí hủy vé: 10%, phí đổi vé: 5%
      </div>
    </div>
  )
}


function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      <div className="font-black text-gray-900 mb-4">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Empty() {
  return (
    <div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
      Trống
    </div>
  )
}

function TicketCard({ booking, canInteract, busy, onCancel, onExchange }) {
  const statusLabel =
    booking.paymentStatus === 'paid'
      ? { text: 'Đã thanh toán', cls: 'bg-green-50 text-green-700 border-green-200' }
      : booking.paymentStatus === 'processing'
        ? { text: 'Đang xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
        : { text: 'Chưa thanh toán / Thất bại', cls: 'bg-red-50 text-red-700 border-red-200' }

  const [expanded, setExpanded] = useState(false)
  const [localCancelReason, setLocalCancelReason] = useState(booking.cancelReason || 'Không hài lòng với chuyến đi')

  // Tính phí hủy
  const cancelFee = Math.round(booking.total * 0.1)
  const cancelRefund = booking.total - cancelFee
  const exchangeFee = Math.round(booking.total * 0.05)

  const isCanceled = booking.cancelStatus === 'canceled'

  return (
    <div className={`border rounded-xl p-4 ${isCanceled ? 'bg-red-50' : 'bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-gray-900">Mã vé: #{booking.id}</div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(booking.createdAt).toLocaleString('vi-VN')}
          </div>
          {isCanceled && (
            <div className="text-xs text-red-600 font-semibold mt-2">
              Vé đã hủy lúc {new Date(booking.canceledAt).toLocaleString('vi-VN')}
            </div>
          )}
          <div className="text-sm font-semibold text-gray-900 mt-3">
            Tổng: {Number(booking.total).toLocaleString('vi-VN')}đ
          </div>
        </div>

        <div className={`text-xs font-bold px-3 py-1 rounded-full border ${statusLabel.cls}`}>
          {statusLabel.text}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {(booking.items || []).map((it, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-sm">
            <div className="text-slate-700">{it.title}</div>
            <div className="text-slate-900 font-semibold">
              {Number(it.price).toLocaleString('vi-VN')}đ x {it.qty}
            </div>
          </div>
        ))}
      </div>

      {(canInteract || expanded) && !isCanceled && (
        <div className="mt-4">
          <button
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            onClick={() => setExpanded((v) => !v)}
            type="button"
          >
            {expanded ? 'Thu gọn' : 'Hủy / Đổi vé'}
          </button>

          {expanded && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Hủy vé */}
              <div className="bg-white border border-red-200 rounded-xl p-4">
                <div className="font-black text-gray-900 text-sm mb-3">Hủy vé</div>
                
                {/* Chi phí hủy */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Giá vé:</span>
                    <span className="font-semibold">{Number(booking.total).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-red-700 font-semibold">
                    <span>Phí hủy (10%):</span>
                    <span>-{cancelFee.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="border-t border-red-200 pt-1 flex justify-between text-green-700 font-bold">
                    <span>Hoàn lại:</span>
                    <span>{cancelRefund.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <input
                  placeholder="Lý do hủy vé..."
                  value={localCancelReason}
                  onChange={(e) => setLocalCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-red-500 text-sm mb-3"
                  disabled={!canInteract || busy}
                />
                <button
                  disabled={!canInteract || busy}
                  onClick={() => onCancel({ reason: localCancelReason })}
                  className={
                    'w-full px-4 py-2 rounded-lg text-white text-sm font-bold transition shadow ' +
                    (!canInteract || busy ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700')
                  }
                >
                  {busy ? 'Đang xử lý...' : 'Xác nhận hủy vé'}
                </button>
              </div>

              {/* Đổi vé */}
              <div className="bg-white border border-indigo-200 rounded-xl p-4">
                <div className="font-black text-gray-900 text-sm mb-3">Đổi vé</div>
                
                {/* Chi phí đổi */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Giá vé hiện tại:</span>
                    <span className="font-semibold">{Number(booking.total).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-indigo-700 font-semibold">
                    <span>Phí đổi vé (5%):</span>
                    <span>-{exchangeFee.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-1 text-xs text-slate-600">
                    <p>Chọn vé mới rồi nhập ghi chú để xác nhận đổi</p>
                  </div>
                </div>

                <button
                  disabled={!canInteract || busy}
                  onClick={() => onExchange()}
                  className={
                    'w-full px-4 py-2 rounded-lg text-white text-sm font-bold transition shadow ' +
                    (!canInteract || busy ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700')
                  }
                >
                  {busy ? 'Đang xử lý...' : 'Mở form đổi vé'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isCanceled && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-red-700 mb-2">Lý do hủy:</div>
          <div className="text-sm text-red-700">{booking.cancelReason || 'Không có ghi chú'}</div>
        </div>
      )}

      {/* Lịch sử đổi vé */}
      {booking.exchanges && booking.exchanges.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-blue-700 mb-2">Lịch sử đổi vé:</div>
          {booking.exchanges.map((ex, idx) => (
            <div key={idx} className="text-xs text-blue-700 mb-2">
              <div>Lần {idx + 1}: {new Date(ex.at).toLocaleString('vi-VN')}</div>
              <div className="ml-2 text-blue-600">
                {ex.note} (Phí: {ex.exchangeFee?.toLocaleString('vi-VN') || '0'}đ)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
