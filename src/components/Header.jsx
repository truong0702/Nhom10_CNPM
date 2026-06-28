import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBus, FaChevronDown, FaSignOutAlt, FaUser } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
            <FaBus className="text-2xl" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-950">Vexere</div>
            <div className="text-xs font-semibold text-slate-500">Đặt vé xe online</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink label="Trang chủ" href="/" />
          <NavLink label="Về chúng tôi" href="/about" />
          <NavLink label="Liên hệ" href="/contact" />
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-sm hover:border-red-200 hover:bg-red-50"
              >
                <UserAvatar user={user} size="sm" />
                <span className="max-w-[150px] truncate">{user.fullName}</span>
                <FaChevronDown className="text-xs text-slate-400" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{user.fullName}</div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">{user.email}</div>
                    </div>
                  </div>

                  <DropdownLink to="/profile" onClick={() => setShowDropdown(false)}>
                    Hồ sơ
                  </DropdownLink>

                  {isAdmin && (
                    <>
                      <div className="px-4 pb-1 pt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                        Quản trị
                      </div>
                      <DropdownLink to="/admin" onClick={() => setShowDropdown(false)}>
                        Bảng quản trị
                      </DropdownLink>
                      <DropdownLink to="/admin/trips" onClick={() => setShowDropdown(false)}>
                        Quản lý chuyến xe
                      </DropdownLink>
                      <DropdownLink to="/admin/tickets" onClick={() => setShowDropdown(false)}>
                        Quản lý vé
                      </DropdownLink>
                      <DropdownLink to="/admin/payments" onClick={() => setShowDropdown(false)}>
                        Quản lý thanh toán
                      </DropdownLink>
                      <DropdownLink to="/admin/users" onClick={() => setShowDropdown(false)}>
                        Quản lý người dùng
                      </DropdownLink>
                      <DropdownLink to="/admin/carriers" onClick={() => setShowDropdown(false)}>
                        Quản lý nhà xe
                      </DropdownLink>
                    </>
                  )}

                  {user.role === 'carrier' && (
                    <DropdownLink to="/carrier" onClick={() => setShowDropdown(false)}>
                      Khu vực nhà xe
                    </DropdownLink>
                  )}

                  <DropdownLink to="/bookings" onClick={() => setShowDropdown(false)}>
                    Vé của tôi
                  </DropdownLink>
                  <DropdownLink to="/support" onClick={() => setShowDropdown(false)}>
                    CSKH
                  </DropdownLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">
                Đăng nhập
              </Link>
              <Link to="/register" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-red-700">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ label, href }) {
  return (
    <Link to={href} className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100 hover:text-red-600">
      {label}
    </Link>
  )
}

function DropdownLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-3 text-sm font-bold hover:bg-slate-50 hover:text-red-600">
      {children}
    </Link>
  )
}

function UserAvatar({ user, size = 'md' }) {
  const initials = String(user?.fullName || user?.email || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm'

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        className={`${sizeClass} shrink-0 rounded-xl object-cover`}
      />
    )
  }

  return (
    <span className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-xl bg-red-50 font-black text-red-600`}>
      {initials || <FaUser />}
    </span>
  )
}
