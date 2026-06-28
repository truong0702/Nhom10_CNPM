import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaBus, FaChair, FaClock, FaMapMarkerAlt, FaStar } from 'react-icons/fa'
import { apiClient } from '../services/api'

export default function TripDetail() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiClient.get(`/trips/${tripId}`)
        setTrip(response.data)
      } catch (err) {
        setError(err.message || 'Không thể tải chi tiết chuyến xe')
        setTrip(null)
      } finally {
        setLoading(false)
      }
    }

    if (tripId) loadTrip()
  }, [tripId])

  if (loading) {
    return <Shell><StateText>Đang tải chi tiết chuyến xe...</StateText></Shell>
  }

  if (error) {
    return <Shell><StateText tone="error">{error}</StateText></Shell>
  }

  if (!trip) {
    return <Shell><StateText>Không tìm thấy chuyến xe.</StateText></Shell>
  }

  const seatsAvailable = trip.seatsAvailable ?? trip.seats ?? 0
  const vehicleType = trip.vehicleType || getVehicleType(trip.bus)

  return (
    <Shell>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        <FaArrowLeft />
        Quay lại
      </button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div className="relative min-h-64 bg-gradient-to-br from-red-50 via-white to-slate-100">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-500">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-red-100 bg-white shadow-inner">
                <FaBus className="text-5xl" />
              </div>
              <div className="px-6 text-center text-lg font-black text-slate-900">{trip.bus}</div>
            </div>
            {trip.image && <img src={trip.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-wide text-red-600">Chi tiết chuyến xe</div>
                <h1 className="mt-2 text-3xl font-black text-slate-950">{trip.from} → {trip.to}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <FaMapMarkerAlt className="text-red-500" />
                  Ngày khởi hành: {trip.date}
                </p>
              </div>
              <div className="text-3xl font-black text-red-600">{Number(trip.price || 0).toLocaleString('vi-VN')}đ</div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric icon={<FaClock />} label="Khởi hành" value={trip.departure} />
              <Metric icon={<FaClock />} label="Đến nơi" value={trip.arrival} />
              <Metric icon={<FaChair />} label="Ghế trống" value={`${seatsAvailable}/${trip.seats}`} />
              <Metric icon={<FaStar />} label="Đánh giá" value={`${trip.rating ?? 0} (${trip.reviews ?? 0})`} />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">Thông tin xe</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm font-semibold text-slate-600 md:grid-cols-2">
                <div>Nhà xe: {trip.Carrier?.name || 'Chưa rõ'}</div>
                <div>Thời lượng: {trip.duration || 'Chưa cập nhật'}</div>
                <div>Loại xe: {getVehicleLabel(vehicleType)}</div>
                <div>Mã chuyến: {trip.id}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/trip/${trip.id}/select-vehicle-variant`}
                state={{ vehicleType }}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700"
              >
                Chọn ghế
              </Link>
              <Link
                to={`/?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}&date=${trip.date}`}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Xem chuyến cùng tuyến
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  )
}

function Shell({ children }) {
  return <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
}

function StateText({ children, tone = 'default' }) {
  const cls = tone === 'error' ? 'text-red-700 bg-red-50 border-red-100' : 'text-slate-600 bg-white border-slate-200'
  return <div className={`rounded-2xl border p-6 text-sm font-bold ${cls}`}>{children}</div>
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        <span className="text-red-500">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-slate-950">{value || '-'}</div>
    </div>
  )
}

function getVehicleType(bus = '') {
  const text = String(bus).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (text.includes('giuong') || text.includes('limousine') || text.includes('sleeper')) return 'sleeping'
  if (text.includes('ghe') || text.includes('ngoi') || text.includes('seat')) return 'seating'
  return 'seating'
}

function getVehicleLabel(vehicleType = '') {
  if (vehicleType === 'sleeping') return 'Xe giường nằm'
  if (vehicleType === 'seating') return 'Xe ghế ngồi'
  return 'Chưa phân loại'
}
