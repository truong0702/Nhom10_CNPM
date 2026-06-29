import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FaBus,
  FaClock,
  FaCreditCard,
  FaHeadset,
  FaMapMarkerAlt,
  FaShieldAlt,
} from 'react-icons/fa'
import SearchForm, { HERO_BG } from '../components/SearchForm'
import TripList from '../components/TripList'
import { searchTrips } from '../services/tripsApi.js'

export default function Home({ onProceedToCheckout }) {
  const [trips, setTrips] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')

    if (from && to && date) {
      handleSearch({ from, to, date })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSearch = async (searchData) => {
    const { date } = searchData || {}
    const now = new Date()
    const minDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')

    if (!date || date < minDate) return

    try {
      setLoading(true)
      setError(null)
      setSearched(false)
      const results = await searchTrips(searchData.from, searchData.to, date, {
        timeOfDay: searchData.timeOfDay,
        vehicleType: searchData.vehicleType,
      })
      const requestedPassengers = Math.max(Number(searchData.passengers || 1), 1)
      setTrips((results || []).map((trip) => ({ ...trip, requestedPassengers })))
      setSearched(true)
    } catch (err) {
      setError(err.message || 'Không thể tìm chuyến xe. Vui lòng thử lại.')
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-white">
      <SearchForm onSearch={handleSearch} disabled={loading} />

      <div className="relative z-10">
        {loading && (
          <div className="flex min-h-80 items-center justify-center bg-white">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-black text-slate-600">
              Đang tải chuyến xe...
            </div>
          </div>
        )}

        {error && (
          <div className="flex min-h-80 items-center justify-center bg-white">
            <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm font-black text-red-700">
              {error}
            </div>
          </div>
        )}

        {searched && !loading && !error && (
          <TripList trips={trips} onProceedToCheckout={onProceedToCheckout} />
        )}

        {!searched && !loading && !error && <HomeHighlights />}
      </div>
    </div>
  )
}

function HomeHighlights() {
  const items = [
    {
      icon: FaClock,
      title: 'Đặt vé nhanh',
      desc: 'Tìm tuyến, so sánh giờ đi và chọn ghế trong cùng một luồng.',
    },
    {
      icon: FaShieldAlt,
      title: 'Thông tin rõ ràng',
      desc: 'Hiển thị giá, ghế trống, đánh giá và trạng thái vé minh bạch.',
    },
    {
      icon: FaCreditCard,
      title: 'Thanh toán linh hoạt',
      desc: 'Hỗ trợ chuyển khoản, ví và thanh toán tại trạm theo nhu cầu.',
    },
    {
      icon: FaHeadset,
      title: 'Theo dõi vé',
      desc: 'Xem vé đã đặt, chờ xác nhận, đổi vé hoặc hủy vé khi đủ điều kiện.',
    },
  ]

  return (
    <section
      className="relative -mt-px overflow-hidden bg-slate-950 pb-16 pt-10 text-white"
      style={{ backgroundImage: HERO_BG, backgroundSize: 'cover', backgroundPosition: 'center bottom' }}
    >
      <div className="absolute inset-0 bg-slate-950/20" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-red-300">Trải nghiệm đặt vé</div>
            <h2 className="mt-2 max-w-xl text-4xl font-black leading-tight">
              Một hành trình liền mạch từ tìm chuyến đến nhận vé
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-slate-300">
              Giao diện dẫn bạn qua từng bước: chọn chuyến, chọn loại xe, chọn ghế và thanh toán. Mọi thông tin quan trọng được giữ trong cùng một màn hình để dễ theo dõi.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat value="3 bước" label="Chọn xe và ghế" />
              <Stat value="24h" label="Xác nhận thanh toán" />
              <Stat value="10%" label="Phí hủy minh bạch" />
            </div>
          </div>

          <AnimatedRoute />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                  <Icon />
                </div>
                <h3 className="text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AnimatedRoute() {
  return (
    <div className="relative min-h-[320px] rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-300">Tuyến đang chạy</div>
          <div className="mt-1 text-xl font-black text-white">Hà Nội → Đà Nẵng</div>
        </div>
        <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
          Còn ghế
        </div>
      </div>

      <div className="relative h-44 overflow-hidden rounded-2xl bg-slate-900/70">
        <div className="absolute left-8 right-8 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/20" />
        <div className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-white/50" />

        <div className="absolute left-7 top-1/2 -translate-y-1/2">
          <RoutePin label="Hà Nội" />
        </div>
        <div className="absolute right-7 top-1/2 -translate-y-1/2">
          <RoutePin label="Đà Nẵng" alignRight />
        </div>

        <div className="route-bus absolute top-1/2 -translate-y-1/2">
          <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-red-500 text-white shadow-xl shadow-red-950/40">
            <FaBus className="text-3xl" />
          </div>
        </div>

        <div className="road-light road-light-1" />
        <div className="road-light road-light-2" />
        <div className="road-light road-light-3" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <RouteMetric label="Khởi hành" value="18:00" />
        <RouteMetric label="Thời gian" value="8h 30m" />
        <RouteMetric label="Giá từ" value="450.000đ" />
      </div>
    </div>
  )
}

function RoutePin({ label, alignRight = false }) {
  return (
    <div className={`flex items-center gap-2 ${alignRight ? 'flex-row-reverse text-right' : ''}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-lg">
        <FaMapMarkerAlt />
      </div>
      <div className="text-xs font-black text-white">{label}</div>
    </div>
  )
}

function RouteMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-300">{label}</div>
    </div>
  )
}
