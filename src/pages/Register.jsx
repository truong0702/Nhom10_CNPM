import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUser, FaEnvelope, FaLock, FaBus, FaPhone } from 'react-icons/fa'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!fullName || !email || !password || !confirmPassword || !phone) {
        throw new Error('Vui lòng điền đầy đủ thông tin')
      }

      if (fullName.length < 3) {
        throw new Error('Họ tên phải có ít nhất 3 ký tự')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Email không hợp lệ')
      }

      if (password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
      }

      if (password !== confirmPassword) {
        throw new Error('Mật khẩu không trùng khớp')
      }

      if (!/^\d{10}$/.test(phone)) {
        throw new Error('Số điện thoại phải có 10 chữ số')
      }

      register(email, password, fullName, phone)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    setPhone(value)
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
            <p className="text-red-100">Tạo tài khoản mới</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Họ tên</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

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
                <p className="text-xs text-gray-500 mt-1">Ít nhất 6 ký tự</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Số điện thoại</label>
                <div className="relative">
                  <FaPhone className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="0987654321"
                    maxLength="10"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer mt-4">
                <input type="checkbox" className="w-4 h-4 text-red-500 rounded mt-1" />
                <span className="text-sm text-gray-600 font-semibold">
                  Tôi đồng ý với <a href="#" className="text-red-500 hover:underline">điều khoản dịch vụ</a> và{' '}
                  <a href="#" className="text-red-500 hover:underline">chính sách bảo mật</a>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                data-testid="register-submit"
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg mt-6"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-600 mt-6 font-semibold">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-600 font-black">
                Đăng nhập
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
