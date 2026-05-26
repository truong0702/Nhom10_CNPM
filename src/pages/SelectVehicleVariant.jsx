import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../services/api'

// Step 2: chọn loại xe và biến thể
export default function SelectVehicleVariant() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const vehicleTypeFromState = location.state?.vehicleType || ''
  const [vehicleVariant, setVehicleVariant] = useState('')

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

  useEffect(() => {
    if (!vehicleTypeFromState) {
      // nếu user refresh state, quay lại step 1
      navigate(`/trip/${tripId}/select-vehicle-type`, { replace: true })
    }
  }, [vehicleTypeFromState, navigate, tripId])

  const options = useMemo(() => {
    if (vehicleTypeFromState === 'sleeping') {
      return [
        { id: 'standard', label: 'Tiêu chuẩn (dưới)' },
        { id: 'vip', label: 'VIP (trên)' },
      ]
    }
    if (vehicleTypeFromState === 'seating') {
      return [
        { id: 'standard', label: 'Tiêu chuẩn' },
        { id: 'comfort', label: 'Ghế êm (comfort)' },
      ]
    }
    return []
  }, [vehicleTypeFromState])

  const onContinue = () => {
    if (!vehicleVariant) return
    navigate(`/trip/${tripId}/select-seat`, {
      state: {
        vehicleType: vehicleTypeFromState,
        vehicleVariant,
      },
    })
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
        <div className="text-sm text-slate-500">Step 2</div>
        <h2 className="text-2xl font-bold">Chọn loại xe (biến thể)</h2>
        <p className="text-sm text-slate-600 mt-1">{trip.bus}</p>
      </div>

      <div className="border rounded-2xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-black text-gray-900">Chọn biến thể</h3>
        <p className="text-sm text-slate-600">Đây là bước chọn loại xe và biến thể.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.id}
              data-testid={`variant-option-${opt.id}`}
              onClick={() => setVehicleVariant(opt.id)}
              className={
                'text-left border rounded-2xl p-4 shadow-sm transition ' +
                (vehicleVariant === opt.id
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-red-300')
              }
            >
              <div className="font-black text-gray-900">{opt.label}</div>
              <div className="text-xs text-slate-500 mt-1">ID: {opt.id}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
            disabled={!vehicleVariant}
            onClick={onContinue}
            data-testid="variant-continue"
          >
            Tiếp tục
          </button>
          <button
            className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm font-medium"
            onClick={() => navigate(-1)}
            data-testid="variant-back"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  )
}

