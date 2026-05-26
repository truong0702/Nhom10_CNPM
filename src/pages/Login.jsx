import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaEnvelope, FaLock, FaBus } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        throw new Error('Vui lòng điền đầy đủ thông tin')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Email không hợp lệ')
      }

      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-400 to-red-600 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
            <FaBus className="text-5xl mb-4 mx-auto" />
            <h1 className="text-3xl font-black mb-2">Vexere</h1>
            <p className="text-red-100">Đăng nhập để đặt vé</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-500 rounded" />
                  <span className="text-gray-700 font-semibold">Nhớ mật khẩu</span>
                </label>
                <Link to="/forgot-password" className="text-red-500 hover:text-red-600 font-semibold">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 font-semibold mt-6">
              Dùng tài khoản đã đăng ký để tiếp tục.
            </p>

            {/* Register Link */}
            <p className="text-center text-gray-600 mt-6 font-semibold">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-red-500 hover:text-red-600 font-black">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-white text-center mt-6 text-sm font-semibold">
          🔒 Thông tin của bạn được bảo mật tuyệt đối
        </p>
      </div>
    </div>
  )
}