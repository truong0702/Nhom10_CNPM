import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateProfile, changePassword } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    setFullName(user.fullName || '')
    setEmail(user.email || '')
  }, [user, navigate])

  const canSubmitProfile = useMemo(() => {
    return Boolean(fullName.trim()) && Boolean(email.trim())
  }, [fullName, email])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!canSubmitProfile) {
      setError('Vui lòng nhập đầy đủ Họ tên và Email')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ')
      return
    }

    setLoading(true)
    try {
      await updateProfile({ fullName: fullName.trim(), email: email.trim() })
      setSuccess('Đã lưu thông tin tài khoản thành công')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp')
      return
    }

    setLoading(true)
    try {
      const res = await changePassword({ currentPassword, newPassword })
      setSuccess(res.message || 'Đã đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-400 to-red-600 flex items-start justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
            <h1 className="text-3xl font-black mb-2">Hồ sơ tài khoản</h1>
            <p className="text-red-100">Chỉnh sửa thông tin & đổi mật khẩu</p>
          </div>

          <div className="p-8 space-y-8">
            {error && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg font-semibold">
                {success}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-xl font-black text-gray-900">Thông tin cá nhân</h2>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Họ tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu email mới đã tồn tại hệ thống sẽ chặn.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !canSubmitProfile}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-3 rounded-xl border-2 border-red-500 text-red-600 font-black hover:bg-red-50 transition-all shadow-sm"
                >
                  Đăng xuất
                </button>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                <Link to="/" className="text-red-600 hover:underline">Về trang chủ</Link>
              </div>
            </form>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <h2 className="text-xl font-black text-gray-900">Đổi mật khẩu</h2>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>

              <p className="text-xs text-gray-500">
                Yêu cầu bắt buộc nhập mật khẩu hiện tại (chuẩn cách 2 bạn chọn).
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

