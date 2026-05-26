import { useMemo, useState, useRef } from 'react'
import { FaMapMarkerAlt, FaCalendar, FaArrowRight, FaUsers } from 'react-icons/fa'

export default function SearchForm({ onSearch, disabled = false }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState('1')
  const [error, setError] = useState('')
  const formRef = useRef(null)

  const minDate = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!from || !to || !date) return

    // Validate không được chọn ngày trong quá khứ
    if (date < minDate) {
      setError('Thời gian không hợp lệ. Vui lòng chọn ngày từ hôm nay trở đi.')
      return
    }

    onSearch({ from, to, date, passengers })
  }


  const popularRoutes = [
    { from: 'Hà Nội', to: 'TP. Hồ Chí Minh' },
    { from: 'Hà Nội', to: 'Đà Nẵng' },
    { from: 'TP. Hồ Chí Minh', to: 'Cần Thơ' },
    { from: 'Huế', to: 'Hà Nội' }
  ]

  const quickSetRoute = (route) => {
    setFrom(route.from)
    setTo(route.to)

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    setDate(dateStr)

    // Schedule form submission after state update
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.dispatchEvent(new Event('submit', { bubbles: true }))
      }
    }, 100)
  }

  return (
    <div className="bg-gradient-to-b from-red-50 via-white to-white py-12 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full opacity-20 -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full opacity-10 -ml-48 -mb-48"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-black text-gray-900 mb-2">Tìm kiếm chuyến xe</h2>
        <p className="text-gray-600 mb-8 text-lg">Khám phá hàng ngàn chuyến xe giá rẻ</p>

        {/* Search Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* From */}
            <SearchInput
              icon={<FaMapMarkerAlt disabled={disabled} />}
              label="Từ"
              placeholder="Hà Nội, TP.HCM..."
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />

            {/* Arrow */}
            <div className="hidden md:flex items-end justify-center pb-3">
              <FaArrowRight className="text-red-500 text-2xl" />
            </div>

            {/* To */}
            <SearchInput
              icon={<FaMapMarkerAlt disabled={disabled} />}
              label="Đến"
              placeholder="Đà Nẵng, Huế..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            {/* Date */}
            <SearchInput
              icon={<FaCalendar disabled={disabled} />}
              label="Ngày"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />


            {/* Error */}
            {error && (
              <div className="md:col-span-5">
                <p className="text-red-600 font-bold">{error}</p>
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaUsers className="text-red-500" /> Khách
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} khách
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-black py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-lg" disabled={disabled}
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </form>

        {/* Popular Routes */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-4">Tuyến đường phổ biến</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularRoutes.map((route, idx) => (
              <button
                key={idx}
                onClick={() => quickSetRoute(route)}
                className="bg-white border-2 border-gray-200 hover:border-red-500 p-3 rounded-lg text-sm font-semibold text-gray-700 hover:text-red-500 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span>{route.from}</span>
                  <FaArrowRight className="text-xs mx-2" />
                  <span>{route.to}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchInput({ icon, label, placeholder, type = 'text', min, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
        <span className="text-red-500">{icon}</span> {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        min={min}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-red-50 transition-all font-semibold bg-white"
      />
    </div>
  )
}
