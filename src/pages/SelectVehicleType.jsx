import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../services/api'

export default function SelectVehicleType() {
  const { tripId } = useParams()
  const navigate = useNavigate()


  const [vehicleType, setVehicleType] = useState('') // 'sleeping' | 'seating'
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await apiClient.get(`/trips/${tripId}`)
        setTrip(response.data)
        setError(null)
      } catch (err) {
        setError(err.message || 'Failed to fetch trip')
        setTrip(null)
      }
    }
    
    if (tripId) {
      fetchTrip()
    }
  }, [tripId])


  const seatLabel = vehicleType === 'sleeping' ? 'Chỗ nằm' : vehicleType === 'seating' ? 'Chỗ ngồi' : ''

  const onContinue = () => {
    if (!vehicleType) return
    navigate(`/trip/${tripId}/select-vehicle-variant`, { state: { vehicleType } })
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-red-600">
          Error loading trip: {error}
        </div>
      </div>
    );
  }

  // Show loading if waiting for trip data
  if (tripId && !trip) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-600">
          Đang tải...
        </div>
      </div>
    );
  }

  // Show not found if no error but trip is null
  if (!trip) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-600">
          Trip not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="border rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-500">Select vehicle type</div>
        <h2 className="text-2xl font-bold">{trip.bus}</h2>
        <p className="text-sm text-slate-600 mt-1">{trip.from} → {trip.to}</p>
      </div>

      <div className="border rounded-2xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-black text-gray-900">Chọn loại xe</h3>
        <p className="text-sm text-slate-600">Chọn xe dường nằm hoặc xe ngồi để hệ thống hiện bước chọn chỗ phù hợp.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <VehicleCard
            title="Xe dường nằm"
            desc="Chỗ nằm (giường)"
            icon="🛏️"

            active={vehicleType === 'sleeping'}
            onClick={() => setVehicleType('sleeping')}
          />
          <VehicleCard
            title="Xe ngồi"
            desc="Chỗ ngồi"
            icon="💺"
            active={vehicleType === 'seating'}
            onClick={() => setVehicleType('seating')}
          />
        </div>

        {vehicleType && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-700">
            Bạn đã chọn: <span className="font-bold">{vehicleType === 'sleeping' ? 'Xe dường nằm' : 'Xe ngồi'}</span> → {seatLabel}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
            disabled={!vehicleType}
            onClick={onContinue}
            data-testid="select-vehicle-continue"
          >
            Tiếp tục
          </button>
          <button
            className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm font-medium"
            onClick={() => navigate(-1)}
            data-testid="select-vehicle-back"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  )
}

function VehicleCard({ title, desc, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'text-left border rounded-2xl p-4 shadow-sm transition ' +
        (active
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white hover:border-red-300')
      }
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="font-black text-gray-900">{title}</div>
          <div className="text-sm text-slate-600 mt-1">{desc}</div>
        </div>
      </div>
    </button>
  )
}

