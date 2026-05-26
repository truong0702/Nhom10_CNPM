import { useState } from 'react'
import TripCard from './TripCard'
import { FaFilter, FaSortAmountDown } from 'react-icons/fa'

export default function TripList({ trips, onProceedToCheckout }) {
  const [selectedTrips, setSelectedTrips] = useState({})
  const [sortBy, setSortBy] = useState('price')

  const prices = (trips || []).map((t) => Number(t.price)).filter((n) => Number.isFinite(n))
  const maxPrice = prices.length ? Math.max(...prices) : 0

  // Default range should match current data, otherwise it can hide all trips.
  const [priceRange, setPriceRange] = useState(maxPrice)

  const handleSelectTrip = (tripId) => {
    setSelectedTrips((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }))
  }


  const sortedTrips = [...trips].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price
    if (sortBy === 'departure') return a.departure.localeCompare(b.departure)
    if (sortBy === 'rating') return b.rating - a.rating
    return 0
  }).filter(trip => trip.price <= priceRange)

  const selectedCount = Object.values(selectedTrips).filter(Boolean).length
  const totalPrice = Object.keys(selectedTrips)
    .filter(key => selectedTrips[key])
    .reduce((sum, key) => sum + trips.find(t => t.id == key).price, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filter */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <FaFilter className="text-red-500" /> Lọc
            </h3>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">Giá tối đa</label>
              <input
                type="range"
                min={0}
                max={Math.max(100000, maxPrice)}
                step={50000}
                value={Math.min(priceRange, Math.max(100000, maxPrice))}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-red-500"
              />
              <p className="text-red-600 font-bold mt-2">{priceRange.toLocaleString()}đ</p>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FaSortAmountDown className="text-red-500" /> Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 font-semibold"
              >
                <option value="price">Giá: Thấp → Cao</option>
                <option value="departure">Giờ khởi hành</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trip Results */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900">
              Chuyến xe khả dụng <span className="text-red-500">({sortedTrips.length})</span>
            </h2>
          </div>

          {sortedTrips.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg">Không tìm thấy chuyến xe phù hợp</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {sortedTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onSelect={() => handleSelectTrip(trip.id)}
                  selected={selectedTrips[trip.id] || false}
                />
              ))}
            </div>
          )}

          {/* Checkout Section */}
          {selectedCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã chọn</p>
                  <p className="text-2xl font-black text-gray-900">
                    {selectedCount} chuyến - <span className="text-red-600">{totalPrice.toLocaleString()}đ</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    const selected = Object.keys(selectedTrips)
                      .filter((key) => selectedTrips[key])
                      .map((key) => trips.find((t) => String(t.id) === String(key)))
                      .filter(Boolean)

                    if (selected.length && onProceedToCheckout) {
                      onProceedToCheckout(selected)
                    }
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Tiếp tục thanh toán
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}