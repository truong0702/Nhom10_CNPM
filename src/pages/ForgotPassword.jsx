import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaEnvelope, FaKey, FaBus } from 'react-icons/fa'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate()
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setResetToken('')
    setLoading(true)

    try {
      if (!email) throw new Error('Vui lòng nhập email')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email không hợp lệ')

      const res = await requestPasswordReset(email)
      setMessage(res.message)

      // Cho phép sao chép mã đặt lại để tiếp tục
      if (res.token) setResetToken(res.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-400 to-red-600 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
            <FaBus className="text-5xl mb-4 mx-auto" />
            <h1 className="text-3xl font-black mb-2">Quên mật khẩu</h1>
            <p className="text-red-100">Nhập email để lấy mã reset</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-6 bg-blue-50 border-2 border-blue-400 text-blue-700 px-4 py-3 rounded-lg font-semibold">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã reset'}
              </button>
            </form>

            {resetToken && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <FaKey className="text-red-500" />
                  <h2 className="font-black text-gray-800">Mã đặt lại (sao chép để tiếp tục)</h2>
                </div>
                <div className="break-all bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-800">
                  {resetToken}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(resetToken)
                    }}
                    className="flex-1 border-2 border-blue-500 text-blue-600 font-black py-2 rounded-xl hover:bg-blue-50 transition text-sm"
                  >
                    Copy token
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="flex-1 border-2 border-red-500 text-red-600 font-black py-2 rounded-xl hover:bg-red-50 transition text-sm"
                  >
                    Đi reset
                  </button>
                </div>
              </div>
            )}

            <p className="text-center text-gray-600 mt-6 font-semibold">
              <Link to="/login" className="text-red-500 hover:text-red-600 font-black">
                Quay lại đăng nhập
              </Link>
            </p>
          </div>
        </div>

        <p className="text-white text-center mt-6 text-sm font-semibold">🔒 Thông tin của bạn được bảo mật tuyệt đối</p>
      </div>
    </div>
  )
}

