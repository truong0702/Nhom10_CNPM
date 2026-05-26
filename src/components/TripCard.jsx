import { FaClock, FaMapMarkerAlt, FaChair, FaStar, FaCheckCircle } from 'react-icons/fa'

export default function TripCard({ trip, onSelect, selected }) {
  const getTimeCategory = (hour) => {
    if (hour >= 6 && hour < 12) return { label: 'Sáng', color: 'bg-amber-100 text-amber-800' }
    if (hour >= 12 && hour < 18) return { label: 'Chiều', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Tối', color: 'bg-indigo-100 text-indigo-800' }
  }

  const hour = parseInt(trip.departure.split(':')[0])
  const timeCategory = getTimeCategory(hour)
  const priceDiscount = Math.floor(Math.random() * 15)

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform hover:shadow-2xl hover:scale-102 ${
      selected
        ? 'border-4 border-red-500 bg-gradient-to-br from-red-50 to-white'
        : 'border-2 border-gray-200 bg-white hover:border-red-300'
    }`}>
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-64 h-40 md:h-auto relative overflow-hidden group">
          <img
            src={trip.image}
            alt={trip.bus}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {priceDiscount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
              -{priceDiscount}%
            </div>
          )}
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full font-bold text-sm ${timeCategory.color}`}>
            {timeCategory.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            {/* Bus Info */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">{trip.bus}</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <FaMapMarkerAlt className="text-red-500" /> {trip.from} → {trip.to}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-red-600">
                  {(trip.price * (100 - priceDiscount) / 100).toLocaleString()}đ
                </div>
                {priceDiscount > 0 && (
                  <p className="text-xs text-gray-400 line-through">{trip.price.toLocaleString()}đ</p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y-2 border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-bold">KHỞI HÀNH</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{trip.departure}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <FaClock className="text-red-500 text-lg mb-2" />
                <p className="text-xs font-bold text-gray-600">{trip.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold">ĐẾN NƠI</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{trip.arrival}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-500 font-bold">GHẾ TRỐNG</p>
                <p className="font-black text-gray-900 flex items-center gap-1 mt-1">
                  <FaChair className="text-red-500" /> {trip.seats}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">ĐÁNH GIÁ</p>
                <div className="flex items-center gap-1 mt-1">
                  <FaStar className="text-yellow-400" />
                  <span className="font-black text-gray-900">{trip.rating}</span>
                  <span className="text-xs text-gray-400">({trip.reviews})</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelect}
              data-testid={`trip-select-${trip.id}`}
              className={`px-8 py-3 rounded-xl font-black transition-all duration-300 flex items-center gap-2 text-lg ${
                selected
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-red-500'
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