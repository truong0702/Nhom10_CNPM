import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import AdminLayout from './components/AdminLayout'
import TripDetail from './components/TripDetail'
import CarrierLayout from './components/CarrierLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import MyTickets from './pages/MyTickets'
import AdminTicketManagement from './pages/AdminTicketManagement'
import CarrierManagement from './pages/CarrierManagement'
import UserManagement from './pages/UserManagement'
import AdminPaymentManagement from './pages/AdminPaymentManagement'
import AdminDashboard from './pages/AdminDashboard'
import AdminFinancePage from './pages/AdminFinancePage'
import SubscriptionPage from './pages/SubscriptionPage'
import VehicleManagement from './pages/VehicleManagement'
import TripManagement from './pages/TripManagement'
import CarrierPortal from './pages/CarrierPortal'
import Checkout from './pages/Checkout'
import SelectVehicleType from './pages/SelectVehicleType'
import SelectVehicleVariant from './pages/SelectVehicleVariant'
import SelectSeat from './pages/SelectSeat'
import PassengerInfo from './pages/PassengerInfo'
import CustomerSupport from './pages/CustomerSupport'
import AdminFeedbackManagement from './pages/AdminFeedbackManagement'
import AdminChatManagement from './pages/AdminChatManagement'
import {
  AboutPage,
  BlogPage,
  CareersPage,
  ContactPage,
  FaqPage,
  PolicyPage,
} from './pages/InfoPages'
import './App.css'


function AppContent() {
  const { loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isCarrierRoute = location.pathname.startsWith('/carrier')

  const [cartItems, setCartItems] = useState([])
  const total = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.price * it.qty, 0)
  }, [cartItems])

  const clearCart = () => setCartItems([])

  useEffect(() => {
    if (!loading && user?.role === 'admin' && !isAdminRoute && ['/', '/login'].includes(location.pathname)) {
      navigate('/admin', { replace: true })
    }
    if (!loading && user?.role === 'carrier' && !isCarrierRoute && ['/', '/login'].includes(location.pathname)) {
      navigate('/carrier', { replace: true })
    }
  }, [isAdminRoute, isCarrierRoute, loading, location.pathname, navigate, user])

  const startCheckoutFromTrips = (trips) => {
    // trips: [{id, bus, from, to, price, ...}]
    // Create cart items but route through seat selection (3 steps) instead of directly checkout.
    const items = (trips || []).map((t) => ({
      id: t.id,
      title: `${t.bus} (${t.from}→${t.to})`,
      price: t.price,
      qty: 1,
      // selections will be filled at seat-selection flow
      vehicleType: null,
      vehicleVariant: null,
      seatType: null,
      selectedSeatLabels: [],
    }))
    setCartItems(items)
    // For simplicity: if multiple trips selected, start from the first one.
    const first = (trips && trips[0]) || null
    if (first) {
      const busName = String(first.bus).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      const isSleeping = busName.includes('giuong') || busName.includes('sleeper') || busName.includes('nam')
      const isVip = busName.includes('vip')
      const isComfort = busName.includes('comfort') || busName.includes('premium') || busName.includes('limousine')
      const vehicleType = isSleeping ? 'sleeping' : 'seating'
      const vehicleVariant = isVip ? 'vip' : isComfort ? 'comfort' : 'standard'

      navigate(`/trip/${first.id}/select-seat`, {
        state: { vehicleType, vehicleVariant },
      })
    } else {
      navigate('/checkout')
    }
  }


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>
  }

  return (
    <>
      {!isAdminRoute && !isCarrierRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onProceedToCheckout={startCheckoutFromTrips} />} />
          <Route path="/browse" element={<Home onProceedToCheckout={startCheckoutFromTrips} />} />
          <Route
            path="/checkout"
            element={
              <Checkout
                cartItems={cartItems}
                total={total}
                onUpdateQty={(id, qty) => {
                  setCartItems((prev) => {
                    const next = prev.map((it) => (it.id === id ? { ...it, qty } : it))
                    return next.filter((it) => it.qty > 0)
                  })
                }}
                onClear={clearCart}
              />
            }
          />

          <Route path="/trip/:tripId" element={<TripDetail />} />
          <Route path="/trip/:tripId/select-vehicle-type" element={<SelectVehicleType />} />
          <Route path="/trip/:tripId/select-vehicle-variant" element={<SelectVehicleVariant />} />
          <Route path="/trip/:tripId/select-seat" element={<SelectSeat />} />
          <Route path="/trip/:tripId/passenger-info" element={<PassengerInfo />} />


          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<MyTickets />} />
          <Route path="/support" element={<CustomerSupport />} />
          <Route path="/subscriptions" element={<SubscriptionPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/trips" element={<AdminLayout><TripManagement /></AdminLayout>} />
          <Route path="/admin/carriers" element={<AdminLayout><CarrierManagement /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
          <Route path="/admin/tickets" element={<AdminLayout><AdminTicketManagement /></AdminLayout>} />
          <Route path="/admin/payments" element={<AdminLayout><AdminPaymentManagement /></AdminLayout>} />
          <Route path="/admin/feedbacks" element={<AdminLayout><AdminFeedbackManagement /></AdminLayout>} />
          <Route path="/admin/chat" element={<AdminLayout><AdminChatManagement /></AdminLayout>} />
          <Route path="/admin/finance" element={<AdminLayout><AdminFinancePage /></AdminLayout>} />
          <Route path="/carrier" element={<CarrierLayout><CarrierPortal /></CarrierLayout>} />
          <Route path="/carrier/trips" element={<CarrierLayout><CarrierPortal /></CarrierLayout>} />
          <Route path="/carrier/bookings" element={<CarrierLayout><CarrierPortal /></CarrierLayout>} />
          <Route path="/carrier/vehicles" element={<CarrierLayout><VehicleManagement /></CarrierLayout>} />
          <Route path="/carrier/subscriptions" element={<CarrierLayout><SubscriptionPage /></CarrierLayout>} />
        </Routes>
      </main>
      {!isAdminRoute && !isCarrierRoute && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <AppContent />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

