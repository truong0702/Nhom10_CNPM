import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaCamera,
  FaCheckCircle,
  FaEnvelope,
  FaIdBadge,
  FaLock,
  FaPhone,
  FaSignOutAlt,
  FaTimesCircle,
  FaTrash,
  FaUser,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import PasswordField from '../components/PasswordField'

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { user, logout, updateProfile, changePassword } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    setFullName(user.fullName || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setAvatar(user.avatar || '')
  }, [user, navigate])

  const initials = useMemo(() => {
    const source = fullName || email || 'U'
    return source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }, [email, fullName])

  const canSubmitProfile = useMemo(() => {
    return Boolean(fullName.trim()) && Boolean(email.trim())
  }, [fullName, email])

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh đại diện không được vượt quá 5MB')
      return
    }

    try {
      setAvatar(await resizeAvatar(file))
    } catch {
      setError('Không thể xử lý ảnh. Vui lòng chọn ảnh khác.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!canSubmitProfile) {
      setError('Vui lòng nhập đầy đủ họ tên và email')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ')
      return
    }

    setSavingProfile(true)
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar,
      })
      setSuccess('Đã cập nhật hồ sơ tài khoản')
    } catch (err) {
      setError(err.message || 'Không thể cập nhật hồ sơ')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
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

    setSavingPassword(true)
    try {
      const res = await changePassword({ currentPassword, newPassword })
      setSuccess(res.message || 'Đã cập nhật mật khẩu')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-red-600">Tài khoản</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Hồ sơ cá nhân</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
              Quản lý ảnh đại diện, thông tin liên hệ và bảo mật tài khoản.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Về trang chủ
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-600 shadow-sm hover:bg-red-50"
            >
              <FaSignOutAlt />
              Đăng xuất
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-slate-900 text-4xl font-black text-white shadow-lg">
                  {avatar ? (
                    <img src={avatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg hover:bg-red-700"
                  aria-label="Đổi ảnh đại diện"
                >
                  <FaCamera />
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

              <h2 className="mt-6 text-xl font-black text-slate-950">{fullName || 'Người dùng'}</h2>
              <p className="mt-1 max-w-full truncate text-sm font-semibold text-slate-500">{email}</p>

              <div className="mt-5 flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
                >
                  Đổi ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  disabled={!avatar}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Xóa ảnh đại diện"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-black uppercase tracking-wide text-slate-400">Tổng quan</div>
            <InfoRow icon={<FaIdBadge />} label="Vai trò" value={getRoleLabel(user?.role)} />
            <InfoRow icon={<FaEnvelope />} label="Email" value={email || '-'} />
            <InfoRow icon={<FaPhone />} label="Số điện thoại" value={phone || 'Chưa cập nhật'} />
          </div>
        </aside>

        <div className="space-y-6">
          {(error || success) && (
            <div
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm ${
                error
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {error ? <FaTimesCircle className="mt-0.5 shrink-0" /> : <FaCheckCircle className="mt-0.5 shrink-0" />}
              <span>{error || success}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Thông tin cá nhân</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Cập nhật thông tin hiển thị trên tài khoản.</p>
              </div>
              <FaUser className="text-xl text-red-500" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Họ tên">
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={inputClass}
                  placeholder="Nguyễn Văn A"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="your@email.com"
                />
              </Field>

              <Field label="Số điện thoại">
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  placeholder="0901234567"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile || !canSubmitProfile}
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>

          <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Đổi mật khẩu</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Dùng mật khẩu mạnh và không chia sẻ với người khác.</p>
              </div>
              <FaLock className="text-xl text-red-500" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Mật khẩu hiện tại">
                <PasswordField
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>

              <Field label="Mật khẩu mới">
                <PasswordField
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>

              <Field label="Xác nhận mật khẩu">
                <PasswordField
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate text-sm font-bold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function getRoleLabel(role) {
  if (role === 'admin') return 'Quản trị viên'
  if (role === 'carrier') return 'Nhà xe'
  return 'Khách hàng'
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxSize = 320
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        canvas.width = width
        canvas.height = height
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }
      image.onerror = reject
      image.src = reader.result
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
