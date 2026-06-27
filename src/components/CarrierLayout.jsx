import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaBus, FaHome, FaRoute, FaSignOutAlt, FaTicketAlt } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/carrier', label: 'Tổng quan', icon: FaHome },
  { to: '/carrier/trips', label: 'Chuyến xe', icon: FaRoute },
  { to: '/carrier/bookings', label: 'Vé đã đặt', icon: FaTicketAlt },
  { to: '/carrier/vehicles', label: 'Quản lý xe', icon: FaBus },
]

export default function CarrierLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.role !== 'carrier') {
      navigate('/', { replace: true })
    }
  }, [navigate, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500">
                <FaBus className="text-2xl" />
              </div>
              <div>
                <div className="text-xl font-black">Vexere Nhà xe</div>
                <div className="text-xs font-semibold text-slate-400">Khu vực đối tác vận hành</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {links.map((item) => (
              <CarrierLink key={item.to} item={item} pathname={location.pathname} />
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-200 hover:bg-red-500/15"
            >
              <FaSignOutAlt />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 lg:px-8">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-red-600">Nhà xe</div>
              <div className="text-lg font-black text-slate-900">Quản lý chuyến và vé của nhà xe</div>
            </div>

            <div className="hidden text-right sm:block">
              <div className="text-sm font-black text-slate-900">{user?.carrier?.name || user?.fullName || 'Nhà xe'}</div>
              <div className="text-xs font-semibold text-slate-500">{user?.email}</div>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {links.map((item) => (
              <CarrierLink key={item.to} item={item} pathname={location.pathname} compact />
            ))}
          </nav>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function CarrierLink({ item, pathname, compact = false }) {
  const Icon = item.icon
  const active = item.to === '/carrier' ? pathname === '/carrier' : pathname.startsWith(item.to)
  const cls = active
    ? 'bg-red-500 text-white shadow-lg shadow-red-950/30'
    : 'text-slate-300 hover:bg-white/10 hover:text-white'

  if (compact) {
    return (
      <Link to={item.to} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${active ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
        <Icon />
        {item.label}
      </Link>
    )
  }

  return (
    <Link to={item.to} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${cls}`}>
      <Icon />
      {item.label}
    </Link>
  )
}
