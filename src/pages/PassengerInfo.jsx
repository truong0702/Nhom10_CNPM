import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PassengerInfo() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập họ tên hành khách')
      return
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Số điện thoại phải có đúng 10 chữ số')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ')
      return
    }

    localStorage.setItem(
      'vexere_passenger',
      JSON.stringify({
        passengerName: name.trim(),
        passengerPhone: phone.trim(),
        passengerEmail: email.trim(),
      })
    )

    navigate('/checkout')
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="border rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-500">Step 4</div>
        <h2 className="text-2xl font-bold">Thông tin hành khách</h2>
        <p className="text-sm text-slate-600 mt-1">
          Nhập thông tin người đi xe để in trên vé
        </p>
      </div>

      <div className="border rounded-2xl bg-white p-6 shadow-sm space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder="Nguyễn Văn A"
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
            placeholder="0901234567"
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="email@example.com"
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <strong>Lưu ý:</strong> Thông tin này sẽ hiển thị trên vé và mã QR. Vui lòng nhập chính xác.
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium"
          >
            Tiếp tục thanh toán
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2.5 rounded-lg border hover:bg-slate-50 transition text-sm font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  )
}
