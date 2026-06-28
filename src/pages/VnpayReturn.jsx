import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import paymentApi from '../services/paymentApi'

export default function VnpayReturn() {
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, success: false, message: '' })

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = Object.fromEntries(searchParams.entries())
        const response = await paymentApi.verifyVnpayReturn(params)
        setState({
          loading: false,
          success: Boolean(response.success),
          message: response.success
            ? `Thanh toán thành công. Mã vé: ${response.ticketCode || response.bookingId || ''}`
            : response.message || 'Thanh toán không thành công',
        })
      } catch (error) {
        setState({
          loading: false,
          success: false,
          message: error.message || 'Không thể xác minh thanh toán VNPay',
        })
      }
    }

    void verifyPayment()
  }, [searchParams])

  if (state.loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="text-2xl font-black text-slate-900">Đang xác minh thanh toán...</div>
          <p className="mt-3 text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className={`rounded-2xl border bg-white p-8 text-center shadow-sm ${state.success ? 'border-green-200' : 'border-red-200'}`}>
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black ${state.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {state.success ? '✓' : '!'}
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {state.success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        </h1>
        <p className="mt-3 text-sm font-semibold text-slate-600">{state.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/bookings" className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">
            Xem vé của tôi
          </Link>
          <Link to="/" className="rounded-xl border px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
