import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../services/api'
import SeatDiagram from '../components/SeatDiagram'

export default function SelectSeat() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const vehicleType = location.state?.vehicleType || ''
  const vehicleVariant = location.state?.vehicleVariant || null

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/trips/${tripId}`)
        setTrip(response.data)
        setError('')
      } catch (err) {
        setError(err.message || 'Failed to fetch trip')
        setTrip(null)
      } finally {
        setLoading(false)
      }
    }

    if (tripId) {
      fetchTrip()
    }
  }, [tripId])

  const qty = 1
  const selectionKey = 'vexere_selection'

  const lockedLabels = useMemo(() => {
    try {
      const raw = localStorage.getItem(selectionKey)
      const map = raw ? JSON.parse(raw) : {}
      const labels = map[String(tripId)]?.selectedSeatLabels
      return Array.isArray(labels) ? labels : []
    } catch {
      return []
    }
  }, [selectionKey, tripId])

  const [selectedSeatLabels, setSelectedSeatLabels] = useState([])

  const seatKind = vehicleType === 'sleeping' ? 'nằm' : 'ngồi'

  const allLabels = useMemo(() => {
    const n = Number(trip?.seats) || 0
    return Array.from({ length: n }, (_, i) => i + 1)
  }, [trip?.seats])

  // Tính giá ghế dựa trên vị trị
  const calculateSeatPrice = (seatNum) => {
    const totalSeats = Number(trip?.seats) || 0
    const vipThreshold = Math.floor(totalSeats * 0.65)
    const isVip = seatNum > vipThreshold
    const isPremium = seatNum % 5 === 0 && seatNum !== 5

    const basePrice = Number(trip?.price) || 500000

    if (isPremium) {
      return Math.round(basePrice * 1.25)
    } else if (isVip) {
      return Math.round(basePrice * 1.15)
    }
    return basePrice
  }

  // Tính tổng giá
  const totalPrice = useMemo(() => {
    return selectedSeatLabels.reduce((sum, seatNum) => sum + calculateSeatPrice(seatNum), 0)
  }, [selectedSeatLabels, trip?.price])

  const seatLabelsText = useMemo(() => selectedSeatLabels.map((x) => String(x)).join(', '), [selectedSeatLabels])

  const toggle = (label) => {
    if (lockedLabels.includes(label)) return

    setSelectedSeatLabels((prev) => {
      const exists = prev.includes(label)
      if (exists) {
        return prev.filter((x) => x !== label)
      }
      if (prev.length >= qty) return prev
      return [...prev, label]
    })
  }

  const canContinue = selectedSeatLabels.length === qty && qty > 0

  const onFinish = () => {
    if (!canContinue) return

    const key = 'vexere_selection'
    const raw = localStorage.getItem(key)
    const map = raw ? JSON.parse(raw) : {}
    map[String(tripId)] = {
      vehicleType,
      vehicleVariant,
      seatType: vehicleType === 'sleeping' ? 'sleeping' : 'seating',
      selectedSeatLabels,
      seatPrices: selectedSeatLabels.map((seatNum) => calculateSeatPrice(seatNum)),
      totalPrice,
      qty,
    }
    localStorage.setItem(key, JSON.stringify(map))

    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-600">Đang tải...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-red-600">Error loading trip: {error}</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-600">Trip not found.</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="border rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-500">Step 3</div>
        <h2 className="text-2xl font-bold">Chọn chỗ {seatKind}</h2>
        <p className="text-sm text-slate-600 mt-1">{trip.bus} • Trống: {trip.seats}</p>
      </div>

      <div className="border rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-black text-gray-900">Số lượng cần chọn</div>
            <div className="text-sm text-slate-600 mt-1">{qty} chỗ</div>
          </div>
          <div className="text-sm text-slate-600">
            Đã chọn: <span className="font-bold text-slate-900">{seatLabelsText || '—'}</span>
          </div>
        </div>

        {/* Hiển thị sơ đồ chỗ */}
        <SeatDiagram
          totalSeats={trip.seats}
          selectedSeats={selectedSeatLabels}
          lockedSeats={lockedLabels}
          onSeatClick={toggle}
          vehicleType={vehicleType}
          maxSelectable={qty}
          basePrice={trip.price}
        />

        {/* Hiển thị giá */}
        {selectedSeatLabels.length > 0 && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              {selectedSeatLabels.map((seatNum) => (
                <div key={seatNum} className="flex justify-between text-sm">
                  <span className="text-slate-600">Chỗ {seatNum}</span>
                  <span className="font-semibold text-slate-900">{calculateSeatPrice(seatNum).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Tổng cộng:</span>
                <span className="font-bold text-lg text-red-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
            disabled={!canContinue}
            onClick={onFinish}
            data-testid="seat-finish"
          >
            Xong & đi đến thanh toán
          </button>
          <button
            className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm font-medium"
            onClick={() => navigate(-1)}
            data-testid="seat-back"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  )
}
