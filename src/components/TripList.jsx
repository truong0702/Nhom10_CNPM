import { useEffect, useMemo, useState } from 'react'
import { FaFilter, FaSortAmountDown } from 'react-icons/fa'
import TripCard from './TripCard'

export default function TripList({ trips, onProceedToCheckout }) {
  const [selectedTrips, setSelectedTrips] = useState({})
  const [sortBy, setSortBy] = useState('price')
  const [vehicleType, setVehicleType] = useState('')

  const prices = useMemo(
    () => (trips || []).map((trip) => Number(trip.price)).filter((price) => Number.isFinite(price)),
    [trips]
  )
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const [priceRange, setPriceRange] = useState(maxPrice)

  useEffect(() => {
    setPriceRange(maxPrice)
    setSelectedTrips({})
  }, [maxPrice, trips])

  const sortedTrips = useMemo(() => {
    return [...trips]
      .filter((trip) => Number(trip.price) <= priceRange)
      .filter((trip) => !vehicleType || getVehicleType(trip.bus) === vehicleType)
      .sort((a, b) => {
        if (sortBy === 'price') return Number(a.price) - Number(b.price)
        if (sortBy === 'departure') return String(a.departure).localeCompare(String(b.departure))
        if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0)
        return 0
      })
  }, [priceRange, sortBy, trips, vehicleType])

  const selected = useMemo(
    () => Object.keys(selectedTrips)
      .filter((key) => selectedTrips[key])
      .map((key) => trips.find((trip) => String(trip.id) === String(key)))
      .filter(Boolean),
    [selectedTrips, trips]
  )

  const totalPrice = selected.reduce((sum, trip) => sum + Number(trip.price || 0), 0)

  const handleSelectTrip = (tripId) => {
    setSelectedTrips((prev) => ({ ...prev, [tripId]: !prev[tripId] }))
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
                <FaFilter className="text-red-500" />
                Bộ lọc
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-black text-slate-700">Giá tối đa</label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(100000, maxPrice)}
                    step={50000}
                    value={Math.min(priceRange, Math.max(100000, maxPrice))}
                    onChange={(event) => setPriceRange(Number(event.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="mt-2 text-xl font-black text-red-600">{priceRange.toLocaleString('vi-VN')}đ</div>
                </div>

                <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                    <FaSortAmountDown className="text-red-500" />
                    Sắp xếp
                  </label>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  >
                    <option value="price">Giá: thấp đến cao</option>
                    <option value="departure">Giờ khởi hành</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-black text-slate-700">Loại xe</label>
                  <select
                    value={vehicleType}
                    onChange={(event) => setVehicleType(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  >
                    <option value="">Tất cả</option>
                    <option value="sleeping">Xe giường nằm</option>
                    <option value="seating">Xe ghế ngồi</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-wide text-red-600">Kết quả tìm kiếm</div>
                <h2 className="mt-1 text-3xl font-black text-slate-950">
                  Chuyến xe khả dụng <span className="text-red-600">({sortedTrips.length})</span>
                </h2>
              </div>
              <div className="text-sm font-semibold text-slate-500">
                Chọn chuyến để tiếp tục chọn xe và ghế.
              </div>
            </div>

            {sortedTrips.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
                <div className="text-lg font-black text-slate-900">Không tìm thấy chuyến xe phù hợp</div>
                <p className="mt-2 text-sm font-semibold text-slate-500">Hãy thử đổi tuyến, ngày khởi hành hoặc mức giá.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-28">
                {sortedTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onSelect={() => handleSelectTrip(trip.id)}
                    selected={Boolean(selectedTrips[trip.id])}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-500">Đã chọn {selected.length} chuyến</div>
              <div className="text-2xl font-black text-slate-950">
                {totalPrice.toLocaleString('vi-VN')}đ
              </div>
            </div>
            <button
              type="button"
              onClick={() => onProceedToCheckout?.(selected)}
              className="rounded-xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700"
            >
              Tiếp tục chọn ghế
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function getVehicleType(bus = '') {
  const text = String(bus).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (text.includes('giuong') || text.includes('limousine') || text.includes('sleeper')) return 'sleeping'
  if (text.includes('ghe') || text.includes('ngoi') || text.includes('seat')) return 'seating'
  return ''
}
