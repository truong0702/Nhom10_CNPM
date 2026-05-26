import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaKey, FaLock, FaBus } from 'react-icons/fa'

export default function ResetPassword() {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (!token.trim()) throw new Error('Vui lòng nhập token')
      if (!newPassword || !confirmPassword) throw new Error('Vui lòng nhập mật khẩu mới')

      if (newPassword.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
      if (newPassword !== confirmPassword) throw new Error('Mật khẩu không trùng khớp')

      // 🔥 FIX #1: Thêm .trim() để xóa khoảng trắng
      const res = resetPassword(token.trim(), newPassword)
      setMessage(res.message)

      // 🔥 FIX #2: Hiện thông báo và navigate ngay thay vì setTimeout
      // Thông báo thành công (không dùng alert để tránh chặn UI/SSR)
      setMessage(res.message || '✅ Mật khẩu đã được đặt lại thành công!')
      navigate('/login')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-400 to-red-600 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
            <FaBus className="text-5xl mb-4 mx-auto" />
            <h1 className="text-3xl font-black mb-2">Đặt lại mật khẩu</h1>
            <p className="text-red-100">Nhập token + mật khẩu mới</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">
                ❌ {error}
              </div>
            )}

            {message && (
              <div className="mb-6 bg-green-50 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg font-semibold">
                ✅ {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Token reset</label>
                <div className="relative">
                  <FaKey className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Nhập token ở bước quên mật khẩu"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-red-500 text-lg" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  />
                </div>
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg mt-2"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6 font-semibold">
              <Link to="/forgot-password" className="text-red-500 hover:text-red-600 font-black">
                Quay lại quên mật khẩu
              </Link>
            </p>
          </div>
        </div>

        <p className="text-white text-center mt-6 text-sm font-semibold">🔒 Thông tin của bạn được bảo mật tuyệt đối</p>
      </div>
    </div>
  )
}