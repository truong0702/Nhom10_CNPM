import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function PasswordField({
  icon,
  value,
  onChange,
  placeholder,
  className = '',
  autoComplete,
  maxLength,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      {icon && <span className="absolute left-4 top-3.5 text-lg text-red-500">{icon}</span>}
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`${className} ${icon ? 'pl-12' : ''} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-red-500"
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  )
}
