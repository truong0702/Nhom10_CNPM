import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBus, FaChair, FaCheckCircle, FaClock, FaMapMarkerAlt, FaStar } from 'react-icons/fa'

export default function TripCard({ trip, onSelect, selected }) {
  const [imageFailed, setImageFailed] = useState(false)

  const hour = Number.parseInt(String(trip.departure || '0').split(':')[0], 10)
  const timeCategory = getTimeCategory(Number.isFinite(hour) ? hour : 0)

  const priceDiscount = useMemo(() => {
    const seed = String(trip.id || trip.bus || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
    return seed % 12
  }, [trip.id, trip.bus])

  const discountedPrice = Math.round(Number(trip.price || 0) * (100 - priceDiscount) / 100)
  const seatsAvailable = trip.seatsAvailable ?? trip.seats ?? 0

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl ${
        selected
          ? 'border-4 border-red-500 bg-gradient-to-br from-red-50 to-white'
          : 'border-2 border-gray-200 bg-white hover:border-red-300'
      }`}
    >
      <div className="flex flex-col xl:flex-row">
        <div className="relative h-44 xl:h-auto xl:min-h-[230px] xl:w-72 shrink-0 overflow-hidden bg-gradient-to-br from-red-50 via-white to-slate-100">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-red-100 bg-white shadow-inner">
              <FaBus className="text-4xl" />
            </div>
            <div className="px-5 text-center text-sm font-black text-slate-800">
              {trip.bus || 'Xe khách'}
            </div>
          </div>

          {trip.image && !imageFailed && (
            <img
              src={trip.image}
              alt=""
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

          <span className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-sm font-bold shadow-sm ${timeCategory.color}`}>
            {timeCategory.label}
          </span>

          {priceDiscount > 0 && (
            <div className="absolute right-4 top-4 z-10 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
              -{priceDiscount}%
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-gray-900">{trip.bus}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <FaMapMarkerAlt className="shrink-0 text-red-500" />
                  <span className="truncate">{trip.from} → {trip.to}</span>
                </p>
              </div>

              <div className="shrink-0 lg:text-right">
                <div className="whitespace-nowrap text-3xl font-black text-red-600 lg:text-4xl">
                  {discountedPrice.toLocaleString('vi-VN')}đ
                </div>
                {priceDiscount > 0 && (
                  <p className="text-xs text-gray-400 line-through">
                    {Number(trip.price || 0).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y-2 border-gray-100 py-4">
              <div>
                <p className="text-xs font-bold text-gray-500">KHỞI HÀNH</p>
                <p className="mt-1 text-2xl font-black text-gray-900">{trip.departure}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <FaClock className="mb-2 text-lg text-red-500" />
                <p className="text-xs font-bold text-gray-600">{trip.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500">ĐẾN NƠI</p>
                <p className="mt-1 text-2xl font-black text-gray-900">{trip.arrival}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500">GHẾ TRỐNG</p>
                <p className="mt-1 flex items-center gap-1 font-black text-gray-900">
                  <FaChair className="text-red-500" /> {seatsAvailable}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500">ĐÁNH GIÁ</p>
                <div className="mt-1 flex items-center gap-1">
                  <FaStar className="text-yellow-400" />
                  <span className="font-black text-gray-900">{trip.rating}</span>
                  <span className="text-xs text-gray-400">({trip.reviews})</span>
                </div>
              </div>
            </div>

            <Link
              to={`/trip/${trip.id}`}
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-black text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Chi tiết
            </Link>

            <button
              onClick={onSelect}
              data-testid={`trip-select-${trip.id}`}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-lg font-black transition-all duration-300 ${
                selected
                  ? 'bg-red-500 text-white shadow-lg hover:bg-red-600'
                  : 'border-2 border-transparent bg-gray-100 text-gray-700 hover:border-red-500 hover:bg-gray-200'
              }`}
            >
              {selected && <FaCheckCircle />}
              {selected ? 'Đã chọn' : 'Chọn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeCategory(hour) {
  if (hour >= 6 && hour < 12) return { label: 'Sáng', color: 'bg-amber-100 text-amber-800' }
  if (hour >= 12 && hour < 18) return { label: 'Chiều', color: 'bg-blue-100 text-blue-800' }
  return { label: 'Tối', color: 'bg-indigo-100 text-indigo-800' }
}
