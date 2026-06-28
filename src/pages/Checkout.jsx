import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createBookingFromCart, updateBookingPaymentStatus } from '../utils/bookingsStorage'
import paymentApi from '../services/paymentApi'

export default function Checkout({ cartItems, total, onUpdateQty, onClear }) {
  const { user } = useAuth()

  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [payStatus, setPayStatus] = useState('idle') // idle | processing | success | failed
  const [errorMsg, setErrorMsg] = useState('')
  const [bankInfo, setBankInfo] = useState(null)
  const [bookingData, setBookingData] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const canPay = cartItems.length > 0 && payStatus !== 'processing'

  const getEnrichedItems = () => {
    let selectionMap = {}
    try {
      selectionMap = JSON.parse(localStorage.getItem('vexere_selection') || '{}')
    } catch {
      selectionMap = {}
    }

    return (cartItems || []).map((it) => {
      const sel = selectionMap[String(it.id)]
      const selectedSeatLabels = sel?.selectedSeatLabels ?? it.selectedSeatLabels ?? []
      const seatPrices = sel?.seatPrices ?? it.seatPrices ?? []
      const computedTotal = sel?.totalPrice ?? it.total ?? (
        Array.isArray(seatPrices) && seatPrices.length
          ? seatPrices.reduce((sum, price) => sum + Number(price || 0), 0)
          : Number(it.price || 0) * Number(it.qty || 1)
      )

      return {
        ...it,
        tripId: it.tripId || it.id,
        qty: selectedSeatLabels.length || it.qty || 1,
        seats: selectedSeatLabels.length || it.seats || it.qty || 1,
        vehicleType: sel?.vehicleType ?? it.vehicleType ?? null,
        vehicleVariant: sel?.vehicleVariant ?? it.vehicleVariant ?? null,
        seatType: sel?.seatType ?? it.seatType ?? null,
        selectedSeatLabels,
        seatPrices,
        total: computedTotal,
      }
    })
  }

  const checkoutItems = useMemo(() => getEnrichedItems(), [cartItems])
  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [checkoutItems]
  )

  // Fetch bank info on mount
  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const response = await paymentApi.getBankInfo()
        setBankInfo(response.data)
      } catch (err) {
        console.error('Failed to fetch bank info:', err)
      }
    }
    fetchBankInfo()
  }, [])

  const pay = async () => {
    if (!user) {
      setErrorMsg('Bạn cần đăng nhập để thanh toán')
      setPayStatus('failed')
      return
    }

    setErrorMsg('')
    setPayStatus('processing')

    // Tạo booking ngay khi bắt đầu xử lý
    const selectionKey = 'vexere_selection'
    let selectionMap = {}
    try {
      selectionMap = JSON.parse(localStorage.getItem(selectionKey) || '{}')
    } catch {
      selectionMap = {}
    }

    const legacyEnrichedItems = (cartItems || []).map((it) => {
      const sel = selectionMap[String(it.id)]
      return {
        ...it,
        vehicleType: sel?.vehicleType ?? it.vehicleType ?? null,
        vehicleVariant: sel?.vehicleVariant ?? it.vehicleVariant ?? null,
        seatType: sel?.seatType ?? it.seatType ?? null,
        selectedSeatLabels: sel?.selectedSeatLabels ?? it.selectedSeatLabels ?? [],
      }
    })

    const enrichedItems = checkoutItems.length ? checkoutItems : legacyEnrichedItems
    const payableTotal = checkoutTotal

    let booking
    try {
      booking = await createBookingFromCart({
        userId: user.id,
        userEmail: user.email,
        items: enrichedItems,
        total: payableTotal,
        paymentMethod,
      })
      setBookingData(booking)
    } catch (err) {
      setPayStatus('failed')
      setErrorMsg(err?.message || 'Không thể tạo booking. Vui lòng thử lại sau.')
      return
    }

    // Nếu là bank transfer, tạo payment record
    if (paymentMethod === 'vnpay') {
      try {
        const response = await paymentApi.createVnpayPayment(booking.id, Number(payableTotal))
        window.location.href = response.paymentUrl
        return
      } catch (err) {
        setPayStatus('failed')
        setErrorMsg(err?.message || 'Không thể tạo thanh toán VNPay. Vui lòng thử lại sau.')
        return
      }
    }

    if (paymentMethod === 'bank_transfer') {
      try {
        const response = await paymentApi.createBankTransferPayment(
          booking.id,
          Number(payableTotal),
          `Booking ${booking.id} - ${enrichedItems[0]?.title || 'Bus Ticket'}`
        )
        setPaymentId(response.payment.id)
        setPayStatus('success')
      } catch (err) {
        setPayStatus('failed')
        setErrorMsg(err?.message || 'Không thể tạo payment record. Vui lòng thử lại sau.')
        return
      }
    } else {
      // For other methods, simulate processing
      await new Promise((r) => setTimeout(r, 1200))
      const forceSuccess = import.meta.env.VITE_FORCE_PAYMENT_SUCCESS === 'true'
      const fail = forceSuccess ? false : Math.random() < 0.15

      try {
        if (fail) {
          await updateBookingPaymentStatus(booking.id, 'failed')
          setPayStatus('failed')
          setErrorMsg('Thanh toán thất bại. Vui lòng thử lại!')
          return
        }

        await updateBookingPaymentStatus(booking.id, 'paid')
        setPayStatus('success')

        setTimeout(() => {
          onClear()
          setPayStatus('idle')
        }, 800)
      } catch (err) {
        setPayStatus('failed')
        setErrorMsg(err?.message || 'Lỗi khi cập nhật trạng thái thanh toán')
        return
      }
    }
  }

  const totalText = useMemo(() => {
    return checkoutTotal.toLocaleString('vi-VN')
  }, [checkoutTotal])

  // Show bank transfer success screen
  if (payStatus === 'success' && paymentMethod === 'bank_transfer' && bankInfo) {
    return (
      <section className="space-y-4">
        <div className="border rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Tạo đơn hàng thành công!</h2>
          <p className="text-gray-600 mb-6">Vui lòng chuyển khoản để hoàn tất thanh toán</p>

          {/* Bank Transfer Instructions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm text-left space-y-6 max-w-md mx-auto">
            {/* Amount */}
            <div className="border-l-4 border-red-500 pl-4">
              <div className="text-sm text-gray-600 font-semibold">SỐ TIỀN CHUYỂN KHOẢN</div>
              <div className="text-3xl font-bold text-red-600 mt-2">
                {totalText}đ
              </div>
            </div>

            {/* Bank Info */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-sm text-gray-600 font-semibold">NGÂN HÀNG</div>
                <div className="text-lg font-bold text-gray-800">{bankInfo.bankName}</div>
                <div className="text-xs text-gray-500">{bankInfo.bankBranch}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 font-semibold">TÊN TÀI KHOẢN</div>
                <div className="text-lg font-bold text-gray-800 font-mono">{bankInfo.accountName}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 font-semibold">SỐ TÀI KHOẢN</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold text-gray-800 font-mono">{bankInfo.accountNumber}</div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bankInfo.accountNumber)
                      alert('Đã copy số tài khoản!')
                    }}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 font-semibold mb-2">NỘI DUNG CHUYỂN</div>
              <div className="text-sm text-gray-800 font-mono bg-white p-2 rounded border-l-2 border-yellow-400">
                Booking {bookingData?.id?.slice(0, 8)}
              </div>
            </div>

            {/* Payment ID */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-600">ID THANH TOÁN</div>
              <div className="text-xs font-mono text-gray-700 mt-1 break-all">{paymentId}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <p className="text-sm text-gray-600">
              ⏱️ Đơn hàng sẽ được xác nhận trong vòng <strong>24 giờ</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  onClear()
                  setPayStatus('idle')
                  setBookingData(null)
                  setPaymentId(null)
                }}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                Hoàn thành
              </button>
              <button
                onClick={() => {
                  window.location.href = '/bookings'
                }}
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
              >
                Xem đơn hàng
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="text-sm text-slate-500">Checkout</div>
        <h2 className="text-2xl font-bold">Review & confirm</h2>
      </div>

      {cartItems.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 border rounded-2xl bg-white p-4 shadow-sm space-y-3">
            {checkoutItems.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 border-b last:border-b-0 pb-3">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-slate-500">{it.price.toLocaleString('vi-VN')}đ × {it.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-9 h-9 rounded-lg border hover:bg-slate-50"
                    onClick={() => onUpdateQty(it.id, it.qty - 1)}
                    disabled={payStatus === 'processing'}
                  >
                    -
                  </button>
                  <div className="w-10 text-center font-semibold">{it.qty}</div>
                  <button
                    className="w-9 h-9 rounded-lg border hover:bg-slate-50"
                    onClick={() => onUpdateQty(it.id, it.qty + 1)}
                    disabled={payStatus === 'processing'}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-slate-600">Total</div>
              <div className="text-xl font-bold">{totalText}đ</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className={
                  'flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium ' +
                  (payStatus === 'processing' ? 'opacity-70 cursor-wait' : '')
                }
                onClick={pay}
                data-testid="checkout-pay"
                disabled={!canPay}
              >
                {payStatus === 'processing' ? 'Đang xử lý...' : payStatus === 'success' ? 'Thanh toán thành công!' : 'Xác nhận thanh toán'}
              </button>
              <button
                className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm font-medium"
                onClick={onClear}
                data-testid="checkout-clear"
                disabled={payStatus === 'processing'}
              >
                Xoá
              </button>
            </div>

            {payStatus === 'failed' && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 font-semibold">
                <span>❌ </span>
                {errorMsg}
              </div>
            )}
          </div>

          <aside className="border rounded-2xl bg-white p-4 shadow-sm space-y-3">
            <div>
              <div className="text-sm font-bold text-slate-700 mb-2">Phương thức thanh toán</div>
              <div className="space-y-2">
                {[
                  { id: 'vnpay', label: 'VNPay' },
                  { id: 'bank_transfer', label: '🏦 Chuyển khoản' },
                  { id: 'wallet', label: '💰 Ví của tôi' },
                  { id: 'cash_at_station', label: '💵 Thanh toán tại trạm' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id)
                      setErrorMsg('')
                    }}
                    disabled={payStatus === 'processing'}
                    className={
                      'w-full text-left px-3 py-2 rounded-xl border transition font-semibold ' +
                      (paymentMethod === m.id
                        ? 'border-red-300 bg-red-50 text-red-800'
                        : 'border-gray-200 hover:border-red-300 bg-white text-slate-800')
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && bankInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                <div className="font-bold mb-2">ℹ️ Hướng dẫn</div>
                <p className="leading-relaxed">
                  Sau khi nhấn "Xác nhận", bạn sẽ nhận được thông tin chuyển khoản. Hãy chuyển khoản chính xác số tiền để hoàn tất.
                </p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
              <div className="font-bold mb-1">Tóm tắt</div>
              <div className="flex items-center justify-between gap-3">
                <span>Phương thức</span>
                <span className="font-bold">
                  {paymentMethod === 'bank_transfer'
                    ? 'Chuyển khoản'
                    : paymentMethod === 'vnpay'
                    ? 'VNPay'
                    : paymentMethod === 'wallet'
                    ? 'Ví'
                    : 'Tại trạm'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 mt-2">
                <span>Tổng tiền</span>
                <span className="font-bold">{totalText}đ</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-600">
          Your cart is empty.
        </div>
      )}
    </section>
  )
}


