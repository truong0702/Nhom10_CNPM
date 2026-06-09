import { useEffect, useMemo, useState } from 'react'
import { FaEdit, FaPlus, FaSave, FaSearch, FaTrash } from 'react-icons/fa'
import adminApi from '../services/adminApi.js'

const emptyForm = {
  carrierId: '',
  from: '',
  to: '',
  departure: '',
  arrival: '',
  duration: '',
  date: '',
  bus: '',
  seats: 40,
  seatsAvailable: 40,
  price: 450000,
  rating: 4.5,
  reviews: 0,
  image: '',
}

export default function TripManagement() {
  const [trips, setTrips] = useState([])
  const [carriers, setCarriers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [tripResponse, carrierResponse] = await Promise.all([
        adminApi.getTrips(),
        adminApi.getCarriers(),
      ])
      setTrips(tripResponse.trips || [])
      setCarriers(carrierResponse.carriers || [])
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu chuyến xe')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredTrips = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return trips

    return trips.filter((trip) => {
      const carrierName = trip.Carrier?.name || ''
      return [trip.from, trip.to, trip.bus, trip.date, carrierName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text))
    })
  }, [query, trips])

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'seats' && !editingId) {
        next.seatsAvailable = value
      }
      return next
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const startEdit = (trip) => {
    setEditingId(trip.id)
    setForm({
      carrierId: trip.carrierId || '',
      from: trip.from || '',
      to: trip.to || '',
      departure: trip.departure || '',
      arrival: trip.arrival || '',
      duration: trip.duration || '',
      date: trip.date || '',
      bus: trip.bus || '',
      seats: trip.seats || 40,
      seatsAvailable: trip.seatsAvailable ?? trip.seats ?? 40,
      price: trip.price || 450000,
      rating: trip.rating ?? 4.5,
      reviews: trip.reviews ?? 0,
      image: trip.image || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        seats: Number(form.seats),
        seatsAvailable: Number(form.seatsAvailable),
        price: Number(form.price),
        rating: Number(form.rating),
        reviews: Number(form.reviews),
      }

      if (editingId) {
        await adminApi.updateTrip(editingId, payload)
      } else {
        await adminApi.createTrip(payload)
      }

      resetForm()
      await load()
    } catch (err) {
      setError(err.message || 'Không thể lưu chuyến xe')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (trip) => {
    const ok = window.confirm(`Xóa chuyến ${trip.from} → ${trip.to} ngày ${trip.date}?`)
    if (!ok) return

    setLoading(true)
    setError('')
    try {
      await adminApi.deleteTrip(trip.id)
      await load()
    } catch (err) {
      setError(err.message || 'Không thể xóa chuyến xe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-red-600">Quản lý vận hành</p>
          <h1 className="text-3xl font-black text-slate-900">Quản lý chuyến xe</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Tạo lịch chạy, cập nhật giá vé, số ghế và tuyến đường cho từng nhà xe.
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
        >
          <FaPlus />
          Chuyến mới
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {editingId ? 'Sửa chuyến xe' : 'Tạo chuyến xe'}
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Điền đủ tuyến, giờ chạy, ngày chạy và giá vé.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Hủy sửa
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Nhà xe">
            <select value={form.carrierId} onChange={(e) => setField('carrierId', e.target.value)} required className={inputClass}>
              <option value="">Chọn nhà xe</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tên xe">
            <input value={form.bus} onChange={(e) => setField('bus', e.target.value)} required className={inputClass} placeholder="Giường nằm 40 chỗ" />
          </Field>

          <Field label="Điểm đi">
            <input value={form.from} onChange={(e) => setField('from', e.target.value)} required className={inputClass} placeholder="Hà Nội" />
          </Field>

          <Field label="Điểm đến">
            <input value={form.to} onChange={(e) => setField('to', e.target.value)} required className={inputClass} placeholder="Đà Nẵng" />
          </Field>

          <Field label="Ngày chạy">
            <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Giờ khởi hành">
            <input type="time" value={form.departure} onChange={(e) => setField('departure', e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Giờ đến">
            <input type="time" value={form.arrival} onChange={(e) => setField('arrival', e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Thời lượng">
            <input value={form.duration} onChange={(e) => setField('duration', e.target.value)} className={inputClass} placeholder="8h 30m" />
          </Field>

          <Field label="Tổng ghế">
            <input type="number" min="1" value={form.seats} onChange={(e) => setField('seats', e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Ghế còn trống">
            <input type="number" min="0" value={form.seatsAvailable} onChange={(e) => setField('seatsAvailable', e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Giá vé">
            <input type="number" min="1000" step="1000" value={form.price} onChange={(e) => setField('price', e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Đánh giá">
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setField('rating', e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />
            {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo chuyến'}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Danh sách chuyến xe</h2>
            <p className="text-sm font-semibold text-slate-500">{filteredTrips.length} chuyến đang hiển thị</p>
          </div>
          <div className="relative md:w-80">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-bold outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
              placeholder="Tìm tuyến, xe, nhà xe..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Tuyến</th>
                <th className="px-5 py-3">Nhà xe</th>
                <th className="px-5 py-3">Ngày/Giờ</th>
                <th className="px-5 py-3">Ghế</th>
                <th className="px-5 py-3">Giá</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center font-bold text-slate-500">Đang tải...</td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center font-bold text-slate-500">Chưa có chuyến xe phù hợp</td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900">{trip.from} → {trip.to}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{trip.bus}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700">{trip.Carrier?.name || 'Không rõ'}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{trip.date}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{trip.departure} - {trip.arrival}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {trip.seatsAvailable}/{trip.seats}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-red-600">{formatCurrency(trip.price)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(trip)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                          aria-label="Sửa chuyến"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(trip)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                          aria-label="Xóa chuyến"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ'
}
