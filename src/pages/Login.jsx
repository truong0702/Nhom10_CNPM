import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBus, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaStore, FaUser } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginAs, setLoginAs] = useState('user')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        throw new Error('Vui lòng điền đầy đủ thông tin')
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Email không hợp lệ')
      }

      const response = await login(email, password, loginAs)
      const nextUser = response?.user || response?.data || response
      if (nextUser?.role === 'admin') navigate('/admin')
      else if (nextUser?.role === 'carrier') navigate('/carrier')
      else navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-500 via-red-400 to-red-600 px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-center text-white">
            <FaBus className="mx-auto mb-4 text-5xl" />
            <h1 className="mb-2 text-3xl font-black">Vexere</h1>
            <p className="text-red-100">
              {loginAs === 'carrier' ? 'Đăng nhập dành cho nhà xe' : 'Đăng nhập để đặt vé'}
            </p>
          </div>

          <div className="p-8">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <ModeButton
                active={loginAs === 'user'}
                icon={<FaUser />}
                label="Khách hàng"
                onClick={() => setLoginAs('user')}
              />
              <ModeButton
                active={loginAs === 'carrier'}
                icon={<FaStore />}
                label="Nhà xe"
                onClick={() => setLoginAs('carrier')}
              />
            </div>

            {error && (
              <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-100 px-4 py-3 font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-gray-700">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-3.5 text-lg text-red-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={loginAs === 'carrier' ? 'carrier@vexe.local' : 'your@email.com'}
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 font-semibold transition-all focus:border-red-500 focus:bg-red-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-gray-700">Mật khẩu</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-lg text-red-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-12 font-semibold transition-all focus:border-red-500 focus:bg-red-50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-red-500"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded text-red-500" />
                  <span className="font-semibold text-gray-700">Nhớ mật khẩu</span>
                </label>
                <Link to="/forgot-password" className="font-semibold text-red-500 hover:text-red-600">
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-lg font-black text-white shadow-lg transition-all hover:from-red-600 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Đang đăng nhập...' : loginAs === 'carrier' ? 'Đăng nhập nhà xe' : 'Đăng nhập'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-semibold text-gray-500">
              {loginAs === 'carrier'
                ? 'Tài khoản nhà xe do admin tạo và duyệt trước khi sử dụng.'
                : 'Dùng tài khoản đã đăng ký để tiếp tục.'}
            </p>

            {loginAs === 'user' && (
              <p className="mt-6 text-center font-semibold text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-black text-red-500 hover:text-red-600">
                  Đăng ký ngay
                </Link>
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-white">
          Thông tin của bạn được bảo mật.
        </p>
      </div>
    </div>
  )
}

function ModeButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ' +
        (active ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:bg-white/60')
      }
    >
      {icon}
      {label}
    </button>
  )
}
