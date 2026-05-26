import { FaBus, FaUser, FaSignOutAlt } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowDropdown(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="text-4xl transform group-hover:scale-110 transition">
            <FaBus />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Vexere</h1>
            <p className="text-xs text-red-100">Đặt vé xe online</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex gap-1 items-center">
          <NavLink label="Trang chủ" href="/" />
          <NavLink label="Về chúng tôi" href="/" />
          <NavLink label="Liên hệ" href="/" />

          {/* User Section */}
          {user ? (
            <div className="relative ml-4">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-white text-red-600 px-6 py-2.5 rounded-lg hover:bg-red-50 transition font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FaUser /> {user.fullName}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-bold text-sm">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-3 hover:bg-red-50 transition font-semibold"
                    onClick={() => setShowDropdown(false)}
                  >
                    👤 Hồ sơ
                  </Link>

                  {/* Admin-only quản lý nhà xe, tài khoản và vé */}
                  {user?.email === 'admin@gmail.com' && (
                    <>
                      <Link
                        to="/admin/carriers"
                        className="block px-4 py-3 hover:bg-red-50 transition font-semibold"
                        onClick={() => setShowDropdown(false)}
                      >
                        🚌 Quản lý nhà xe
                      </Link>
                      <Link
                        to="/admin/users"
                        className="block px-4 py-3 hover:bg-red-50 transition font-semibold"
                        onClick={() => setShowDropdown(false)}
                      >
                        👥 Quản lý tài khoản
                      </Link>
                      <Link
                        to="/admin/tickets"
                        className="block px-4 py-3 hover:bg-red-50 transition font-semibold"
                        onClick={() => setShowDropdown(false)}
                      >
                        🎟️ Quản lý vé
                      </Link>
                    </>
                  )}



                  <Link
                    to="/bookings"
                    className="block px-4 py-3 hover:bg-red-50 transition font-semibold"
                    onClick={() => setShowDropdown(false)}
                  >
                    🎫 Đặt vé của tôi
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition font-semibold text-red-600 flex items-center gap-2 border-t border-gray-200"
                  >
                    <FaSignOutAlt /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white px-4 py-2 font-semibold hover:text-red-100 transition ml-4"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-white text-red-600 px-6 py-2.5 rounded-lg hover:bg-red-50 transition font-bold shadow-lg hover:shadow-xl ml-2"
              >
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function NavLink({ label, href }) {
  return (
    <Link to={href} className="px-4 py-2 text-white font-semibold hover:text-red-100 transition relative group">
      {label}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
    </Link>
  )
}