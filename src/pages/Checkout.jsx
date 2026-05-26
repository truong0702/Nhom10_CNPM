import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createBookingFromCart, updateBookingPaymentStatus } from '../utils/bookingsStorage'


export default function Checkout({ cartItems, total, onUpdateQty, onClear }) {
  const { user } = useAuth()

  const [paymentMethod, setPaymentMethod] = useState('vnpay')
  const [payStatus, setPayStatus] = useState('idle') // idle | processing | success | failed
  const [errorMsg, setErrorMsg] = useState('')
  const canPay = cartItems.length > 0 && payStatus !== 'processing'

  const pay = async () => {
    if (!user) {
      setErrorMsg('Bạn cần đăng nhập để thanh toán')
      setPayStatus('failed')
      return
    }

    setErrorMsg('')
    setPayStatus('processing')

    // Tạo booking ngay khi bắt đầu xử lý
    // Gắn thông tin ghế đã chọn nếu có.
    const selectionKey = 'vexere_selection'
    let selectionMap = {}
    try {
      selectionMap = JSON.parse(localStorage.getItem(selectionKey) || '{}')
    } catch {
      selectionMap = {}
    }

    const enrichedItems = (cartItems || []).map((it) => {
      const sel = selectionMap[String(it.id)]
      return {
        ...it,
        vehicleType: sel?.vehicleType ?? it.vehicleType ?? null,
        vehicleVariant: sel?.vehicleVariant ?? it.vehicleVariant ?? null,
        seatType: sel?.seatType ?? it.seatType ?? null,
        selectedSeatLabels: sel?.selectedSeatLabels ?? it.selectedSeatLabels ?? [],
      }
    })

    let booking
    try {
      booking = await createBookingFromCart({
        userId: user.id,
        userEmail: user.email,
        items: enrichedItems,
        total,
        paymentMethod,
      })
    } catch (err) {
      setPayStatus('failed')
      setErrorMsg(err?.message || 'Không thể tạo booking. Vui lòng thử lại sau.')
      return
    }

    // Mô phỏng xử lý trong 1.2s (giữ để UX)
    await new Promise((r) => setTimeout(r, 1200))

    // Nếu biến môi trường VITE_FORCE_PAYMENT_SUCCESS=true thì ép thành công
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

      // Xoá cart sau khi success
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


  const totalText = useMemo(() => {
    // total đang là number theo code cart của App.jsx
    return total.toLocaleString('vi-VN')
  }, [total])

  return (
    <section className="space-y-4">
      <div>
        <div className="text-sm text-slate-500">Checkout</div>
        <h2 className="text-2xl font-bold">Review & confirm</h2>
      </div>

      {cartItems.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 border rounded-2xl bg-white p-4 shadow-sm space-y-3">
            {cartItems.map((it) => (
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
                {payStatus === 'processing' ? 'Đang thanh toán...' : payStatus === 'success' ? 'Thanh toán thành công!' : 'Xác nhận thanh toán'}
              </button>
              <button
                className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm font-medium"
                onClick={onClear}
                data-testid="checkout-clear"
                disabled={payStatus === 'processing'}
              >
                Clear
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
                  { id: 'momo', label: 'MoMo' },
                  { id: 'bank', label: 'Chuyển khoản' },
                  { id: 'card', label: 'Thẻ' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
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

            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
              <div className="font-bold mb-1">Tóm tắt</div>
              <div className="flex items-center justify-between gap-3">
                <span>Phương thức</span>
                <span className="font-bold">
                  {paymentMethod === 'vnpay'
                    ? 'VNPay'
                    : paymentMethod === 'momo'
                      ? 'MoMo'
                      : paymentMethod === 'bank'
                        ? 'Chuyển khoản'
                        : 'Thẻ'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 mt-2">
                <span>Tổng tiền</span>
                <span className="font-bold">{totalText}đ</span>
              </div>

              <div className="mt-3 text-slate-600">
                Chức năng thanh toán hiện tại dùng mô phỏng nội bộ và chưa kết nối cổng thanh toán.
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


