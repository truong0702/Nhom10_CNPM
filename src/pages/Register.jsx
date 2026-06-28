import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBus, FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone, FaStore, FaUser } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [mode, setMode] = useState('user')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [carrierName, setCarrierName] = useState('')
  const [carrierAddress, setCarrierAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register, registerCarrier } = useAuth()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      validateCommonFields({ fullName, email, password, confirmPassword, phone })

      if (mode === 'carrier') {
        if (!carrierName.trim()) {
          throw new Error('Vui lòng nhập tên nhà xe')
        }

        await registerCarrier({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone,
          carrierName: carrierName.trim(),
          carrierPhone: phone,
          carrierAddress: carrierAddress.trim(),
        })
        navigate('/carrier')
        return
      }

      await register(email.trim(), password, fullName.trim(), phone)
      navigate('/')
    } catch (err) {
      setError(getRegisterErrorMessage(err, mode))
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-500 via-red-400 to-red-600 px-4 pt-20">
      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-center text-white">
            <FaBus className="mx-auto mb-4 text-5xl" />
            <h1 className="mb-2 text-3xl font-black">Vexere</h1>
            <p className="text-red-100">
              {mode === 'carrier' ? 'Đăng ký tài khoản nhà xe' : 'Tạo tài khoản khách hàng'}
            </p>
          </div>

          <div className="p-8">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <ModeButton
                active={mode === 'user'}
                icon={<FaUser />}
                label="Khách hàng"
                onClick={() => setMode('user')}
              />
              <ModeButton
                active={mode === 'carrier'}
                icon={<FaStore />}
                label="Nhà xe"
                onClick={() => setMode('carrier')}
              />
            </div>

            {error && (
              <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-100 px-4 py-3 font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'carrier' && (
                <>
                  <TextField
                    icon={<FaStore />}
                    label="Tên nhà xe"
                    value={carrierName}
                    onChange={setCarrierName}
                    placeholder="Nhà xe Trường Express"
                  />
                  <TextField
                    icon={<FaMapMarkerAlt />}
                    label="Địa chỉ nhà xe"
                    value={carrierAddress}
                    onChange={setCarrierAddress}
                    placeholder="Quận 1, TP. Hồ Chí Minh"
                  />
                </>
              )}

              <TextField
                icon={<FaUser />}
                label={mode === 'carrier' ? 'Người đại diện' : 'Họ tên'}
                value={fullName}
                onChange={setFullName}
                placeholder="Nguyễn Văn A"
              />

              <TextField
                icon={<FaEnvelope />}
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={mode === 'carrier' ? 'nhaxe@email.com' : 'your@email.com'}
              />

              <TextField
                icon={<FaPhone />}
                label="Số điện thoại"
                type="tel"
                value={phone}
                onChangeRaw={handlePhoneChange}
                placeholder="0987654321"
                maxLength="10"
              />

              <TextField
                icon={<FaLock />}
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              <TextField
                icon={<FaLock />}
                label="Xác nhận mật khẩu"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
              />

              <label className="mt-4 flex cursor-pointer items-start gap-2">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded text-red-500" />
                <span className="text-sm font-semibold text-gray-600">
                  Tôi đồng ý với <a href="#" className="text-red-500 hover:underline">điều khoản dịch vụ</a> và{' '}
                  <a href="#" className="text-red-500 hover:underline">chính sách bảo mật</a>
                </span>
              </label>

              {mode === 'carrier' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                  Tài khoản nhà xe mới sẽ ở trạng thái chờ duyệt. Sau khi admin duyệt, nhà xe có thể tạo chuyến.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                data-testid="register-submit"
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-lg font-black text-white shadow-lg transition-all hover:from-red-600 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Đang tạo tài khoản...' : mode === 'carrier' ? 'Đăng ký nhà xe' : 'Đăng ký'}
              </button>
            </form>

            <p className="mt-6 text-center font-semibold text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-black text-red-500 hover:text-red-600">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-white">
          Thông tin của bạn được bảo mật.
        </p>
      </div>
    </div>
  )
}

function getRegisterErrorMessage(error, mode) {
  const message = error?.message || ''
  if (error?.status === 409) {
    if (mode === 'carrier') {
      return message || 'Email nay da ton tai. Vui long dung email khac hoac dung dung mat khau cua tai khoan hien co.'
    }
    return message || 'Email nay da duoc dang ky. Vui long dung email khac.'
  }

  return message || 'Khong the dang ky. Vui long kiem tra lai thong tin.'
}

function TextField({
  icon,
  label,
  type = 'text',
  value,
  onChange,
  onChangeRaw,
  placeholder,
  maxLength,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-gray-700">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-3.5 text-lg text-red-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChangeRaw || ((event) => onChange(event.target.value))}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 font-semibold transition-all focus:border-red-500 focus:bg-red-50 focus:outline-none"
        />
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

function validateCommonFields({ fullName, email, password, confirmPassword, phone }) {
  if (!fullName || !email || !password || !confirmPassword || !phone) {
    throw new Error('Vui lòng điền đầy đủ thông tin')
  }
  if (fullName.trim().length < 3) {
    throw new Error('Họ tên phải có ít nhất 3 ký tự')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
}
