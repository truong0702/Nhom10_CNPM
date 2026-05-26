import { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
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
import Checkout from './pages/Checkout'
import SelectVehicleType from './pages/SelectVehicleType'
import SelectVehicleVariant from './pages/SelectVehicleVariant'
import SelectSeat from './pages/SelectSeat'
import './App.css'


function AppContent() {
  const { loading } = useAuth()
  const navigate = useNavigate()

  const [cartItems, setCartItems] = useState([])
  const total = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.price * it.qty, 0)
  }, [cartItems])

  const clearCart = () => setCartItems([])

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
      navigate(`/trip/${first.id}/select-vehicle-type`)
    } else {
      navigate('/checkout')
    }
  }


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onProceedToCheckout={startCheckoutFromTrips} />} />
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

          <Route path="/trip/:tripId/select-vehicle-type" element={<SelectVehicleType />} />
          <Route path="/trip/:tripId/select-vehicle-variant" element={<SelectVehicleVariant />} />
          <Route path="/trip/:tripId/select-seat" element={<SelectSeat />} />


          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<MyTickets />} />
          <Route path="/admin/carriers" element={<CarrierManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/tickets" element={<AdminTicketManagement />} />
        </Routes>
      </main>
      <Footer />
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

