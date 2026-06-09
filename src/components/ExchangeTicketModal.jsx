import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/api'

export default function ExchangeTicketModal({ booking, onConfirm, onCancel, loading }) {
  const [trips, setTrips] = useState([])

  useEffect(() => {
    let active = true

    const loadTrips = async () => {
      try {
        const response = await apiClient.get('/trips', { params: { limit: 50 } })
        if (active) setTrips(response.data || [])
      } catch {
        if (active) setTrips([])
      }
    }

    loadTrips()
    return () => {
      active = false
    }
  }, [])

  const [selectedTripId, setSelectedTripId] = useState(null)
  const [vehicleType, setVehicleType] = useState('seating')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [occupiedSeatLabels, setOccupiedSeatLabels] = useState([])
  const [exchangeNote, setExchangeNote] = useState('Đổi vé')

  const selectedTrip = useMemo(
    () => trips.find((t) => String(t.id) === String(selectedTripId)),
    [trips, selectedTripId]
  )

  useEffect(() => {
    let active = true

    const loadSeats = async () => {
      if (!selectedTripId) {
        setOccupiedSeatLabels([])
        return
      }

      try {
        const response = await apiClient.get(`/trips/${selectedTripId}/seats`)
        if (active) setOccupiedSeatLabels(response.data?.occupiedSeatLabels || [])
      } catch {
        if (active) setOccupiedSeatLabels([])
      }
    }

    loadSeats()
    return () => {
      active = false
    }
  }, [selectedTripId])

  // Tạo layout ghế (giống SeatDiagram)
  const seatLayout = useMemo(() => {
    if (!selectedTrip) return []
    const totalSeats = selectedTrip.seats

    if (vehicleType === 'sleeping') {
      const rows = []
      const seatsPerRow = 2
      const numRows = Math.ceil(totalSeats / seatsPerRow)
      for (let i = 0; i < numRows; i++) {
        const rowSeats = []
        for (let j = 0; j < seatsPerRow; j++) {
          const seatNum = i * seatsPerRow + j + 1
          if (seatNum <= totalSeats) rowSeats.push(seatNum)
        }
        rows.push(rowSeats)
      }
      return rows
    } else {
      const rows = []
      let seatNum = 1
      const leftSeats = 3
      const rightSeats = 2
      const seatsPerRow = leftSeats + rightSeats
      const numRows = Math.ceil(totalSeats / seatsPerRow)

      for (let i = 0; i < numRows && seatNum <= totalSeats; i++) {
        const rowSeats = { left: [], right: [] }
        for (let j = 0; j < leftSeats && seatNum <= totalSeats; j++) {
          rowSeats.left.push(seatNum++)
        }
        for (let j = 0; j < rightSeats && seatNum <= totalSeats; j++) {
          rowSeats.right.push(seatNum++)
        }
        rows.push(rowSeats)
      }
      return rows
    }
  }, [selectedTrip, vehicleType])

  const toggleSeat = (seatNum) => {
    if (occupiedSeatLabels.map(Number).includes(Number(seatNum))) return

    setSelectedSeats((prev) => {
      if (prev.includes(seatNum)) {
        return prev.filter((s) => s !== seatNum)
      }
      if (prev.length >= 1) return prev
      return [...prev, seatNum]
    })
  }

  const canConfirm =
    selectedTripId &&
    selectedSeats.length > 0 &&
    exchangeNote.trim().length > 0

  const handleConfirm = () => {
    const toItems = [
      {
        id: selectedTrip.id,
        tripId: selectedTrip.id,
        title: selectedTrip.bus,
        price: selectedTrip.price,
        qty: 1,
        seats: selectedSeats.length,
        vehicleType,
        vehicleVariant: selectedTrip.bus,
        seatType: vehicleType === 'sleeping' ? 'sleeping' : 'seating',
        selectedSeatLabels: selectedSeats,
        total: Number(selectedTrip.price) * selectedSeats.length,
      },
    ]
    onConfirm({ toItems, note: exchangeNote })
  }

  const exchangeFee = Math.round(booking.total * 0.05)

  const getSeatClass = (seatNum) => {
    if (occupiedSeatLabels.map(Number).includes(Number(seatNum))) {
      return 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'
    }
    if (selectedSeats.includes(seatNum)) {
      return 'bg-indigo-500 border-indigo-600 text-white'
    }
    return 'bg-white border-green-300 hover:bg-green-50'
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Đổi vé</h2>
          <p className="text-sm text-slate-600 mt-1">Chọn chuyến đi mới và ghế để đổi vé</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Thông tin phí */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-700">Vé cũ:</span>
              <span className="font-semibold">{Number(booking.total).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span className="text-sm font-semibold">Phí đổi vé (5%):</span>
              <span className="font-bold">-{exchangeFee.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {/* Chọn chuyến đi */}
          <div>
            <label className="block font-bold text-gray-900 mb-3">Chọn chuyến đi mới</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {trips.length === 0 ? (
                <div className="text-sm text-slate-600">Không có chuyến đi nào</div>
              ) : (
                trips.map((trip) => (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => {
                      setSelectedTripId(trip.id)
                      setSelectedSeats([])
                    }}
                    className={
                      'w-full text-left p-3 rounded-lg border-2 transition ' +
                      (selectedTripId === trip.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300')
                    }
                  >
                    <div className="font-semibold text-sm">
                      {trip.bus} • {trip.from} → {trip.to}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {trip.departure} - {trip.arrival} ({trip.duration}) • {trip.price.toLocaleString('vi-VN')}đ
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedTrip && (
            <>
              {/* Chọn loại xe */}
              <div>
                <label className="block font-bold text-gray-900 mb-3">Loại xe</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVehicleType('seating')}
                    className={
                      'flex-1 p-3 rounded-lg border-2 font-semibold transition text-sm ' +
                      (vehicleType === 'seating'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300')
                    }
                  >
                    💺 Xe ngồi
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleType('sleeping')}
                    className={
                      'flex-1 p-3 rounded-lg border-2 font-semibold transition text-sm ' +
                      (vehicleType === 'sleeping'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300')
                    }
                  >
                    🛏️ Xe nằm
                  </button>
                </div>
              </div>

              {/* Chọn ghế */}
              <div>
                <label className="block font-bold text-gray-900 mb-3">Chọn ghế</label>
                <div className="bg-slate-50 border rounded-lg p-4">
                  {vehicleType === 'sleeping' ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-slate-600 text-center mb-3">
                        Tầng trên
                      </div>
                      {seatLayout.slice(0, Math.ceil(selectedTrip.seats / 4)).map((rowSeats, idx) => (
                        <div key={`top-${idx}`} className="flex justify-center gap-2">
                          {rowSeats.map((seatNum) => (
                            <button
                              key={seatNum}
                              type="button"
                              disabled={occupiedSeatLabels.map(Number).includes(Number(seatNum))}
                              onClick={() => toggleSeat(seatNum)}
                              className={
                                'w-10 h-10 rounded-lg border-2 font-bold text-xs transition ' +
                                getSeatClass(seatNum)
                              }
                            >
                              {seatNum}
                            </button>
                          ))}
                        </div>
                      ))}
                      <div className="my-2 border-t-2 border-dashed"></div>
                      <div className="text-xs font-semibold text-slate-600 text-center mb-3">
                        Tầng dưới
                      </div>
                      {seatLayout.slice(Math.ceil(selectedTrip.seats / 4)).map((rowSeats, idx) => (
                        <div key={`bottom-${idx}`} className="flex justify-center gap-2">
                          {rowSeats.map((seatNum) => (
                            <button
                              key={seatNum}
                              type="button"
                              disabled={occupiedSeatLabels.map(Number).includes(Number(seatNum))}
                              onClick={() => toggleSeat(seatNum)}
                              className={
                                'w-10 h-10 rounded-lg border-2 font-bold text-xs transition ' +
                                getSeatClass(seatNum)
                              }
                            >
                              {seatNum}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {seatLayout.map((rowSeats, idx) => (
                        <div key={idx} className="flex justify-center items-center gap-2">
                          <div className="flex gap-1">
                            {rowSeats.left?.map((seatNum) => (
                              <button
                                key={seatNum}
                                type="button"
                                disabled={occupiedSeatLabels.map(Number).includes(Number(seatNum))}
                                onClick={() => toggleSeat(seatNum)}
                                className={
                                  'w-8 h-8 rounded border-2 font-bold text-xs transition ' +
                                  getSeatClass(seatNum)
                                }
                              >
                                {seatNum}
                              </button>
                            ))}
                          </div>
                          <div className="w-6 h-8 flex items-center justify-center text-xs font-bold text-slate-400">
                            | |
                          </div>
                          <div className="flex gap-1">
                            {rowSeats.right?.map((seatNum) => (
                              <button
                                key={seatNum}
                                type="button"
                                disabled={occupiedSeatLabels.map(Number).includes(Number(seatNum))}
                                onClick={() => toggleSeat(seatNum)}
                                className={
                                  'w-8 h-8 rounded border-2 font-bold text-xs transition ' +
                                  getSeatClass(seatNum)
                                }
                              >
                                {seatNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-gray-900 mb-2">Ghi chú đổi vé</label>
                <input
                  type="text"
                  value={exchangeNote}
                  onChange={(e) => setExchangeNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Lý do đổi vé..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border text-sm font-bold hover:bg-slate-100 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận đổi vé'}
          </button>
        </div>
      </div>
    </div>
  )
}
