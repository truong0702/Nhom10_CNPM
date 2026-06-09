import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaEdit, FaPlus, FaSave, FaTrash } from 'react-icons/fa'
import carrierApi from '../services/carrierApi'

const emptyForm = {
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
  image: '',
}

export default function CarrierPortal() {
  const location = useLocation()
  const view = location.pathname.includes('/bookings')
    ? 'bookings'
    : location.pathname.includes('/trips')
      ? 'trips'
      : 'dashboard'

  const [carrier, setCarrier] = useState(null)
  const [trips, setTrips] = useState([])
  const [bookings, setBookings] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [tripResponse, bookingResponse] = await Promise.all([
        carrierApi.getTrips(),
        carrierApi.getBookings(),
      ])
      setCarrier(tripResponse.carrier || bookingResponse.carrier || null)
      setTrips(tripResponse.trips || [])
      setBookings(bookingResponse.bookings || [])
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu nhà xe')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'paid')
    const revenue = paidBookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0)
    return {
      trips: trips.length,
      bookings: bookings.length,
      paid: paidBookings.length,
      revenue,
    }
  }, [bookings, trips])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'seats' && !editingId) next.seatsAvailable = value
      return next
    })
  }

  const startEdit = (trip) => {
    setEditingId(trip.id)
    setForm({
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
      }
      if (editingId) await carrierApi.updateTrip(editingId, payload)
      else await carrierApi.createTrip(payload)
      resetForm()
      await load()
    } catch (err) {
      setError(err.message || 'Không thể lưu chuyến xe')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (trip) => {
    if (!window.confirm(`Xóa chuyến ${trip.from} → ${trip.to} ngày ${trip.date}?`)) return
    setLoading(true)
    setError('')
    try {
      await carrierApi.deleteTrip(trip.id)
      await load()
    } catch (err) {
      setError(err.message || 'Không thể xóa chuyến xe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Header carrier={carrier} />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {view === 'dashboard' && (
        <Dashboard stats={stats} carrier={carrier} loading={loading} />
      )}

      {view === 'trips' && (
        <>
          <TripForm
            form={form}
            editingId={editingId}
            saving={saving}
            onSubmit={handleSubmit}
            onReset={resetForm}
            setField={setField}
          />
          <TripTable trips={trips} loading={loading} onEdit={startEdit} onDelete={handleDelete} />
        </>
      )}

      {view === 'bookings' && (
        <BookingTable bookings={bookings} loading={loading} />
      )}
    </div>
  )
}

function Header({ carrier }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-red-600">Khu vực nhà xe</div>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{carrier?.name || 'Nhà xe'}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Quản lý lịch chạy, số ghế, giá vé và theo dõi vé khách đã đặt.
          </p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-black ${carrier?.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {carrier?.approved ? 'Đã được duyệt' : 'Chờ admin duyệt'}
        </div>
      </div>
    </section>
  )
}

function Dashboard({ stats, carrier, loading }) {
  const cards = [
    { label: 'Chuyến xe', value: stats.trips },
    { label: 'Vé đã đặt', value: stats.bookings },
    { label: 'Vé đã thanh toán', value: stats.paid },
    { label: 'Doanh thu ghi nhận', value: formatCurrency(stats.revenue) },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black uppercase tracking-wide text-slate-500">{card.label}</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{loading ? '-' : card.value}</div>
        </div>
      ))}
      {carrier?.status === 'inactive' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800 md:col-span-2 xl:col-span-4">
          Nhà xe đang ở trạng thái không hoạt động. Vui lòng liên hệ admin để mở lại trước khi tạo chuyến mới.
        </div>
      )}
    </section>
  )
}

function TripForm({ form, editingId, saving, onSubmit, onReset, setField }) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">{editingId ? 'Sửa chuyến xe' : 'Tạo chuyến xe'}</h2>
          <p className="text-sm font-semibold text-slate-500">Nhà xe chỉ quản lý các chuyến thuộc tài khoản của mình.</p>
        </div>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50">
          <FaPlus />
          Chuyến mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tên xe"><input value={form.bus} onChange={(e) => setField('bus', e.target.value)} required className={inputClass} /></Field>
        <Field label="Điểm đi"><input value={form.from} onChange={(e) => setField('from', e.target.value)} required className={inputClass} /></Field>
        <Field label="Điểm đến"><input value={form.to} onChange={(e) => setField('to', e.target.value)} required className={inputClass} /></Field>
        <Field label="Ngày chạy"><input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required className={inputClass} /></Field>
        <Field label="Giờ khởi hành"><input type="time" value={form.departure} onChange={(e) => setField('departure', e.target.value)} required className={inputClass} /></Field>
        <Field label="Giờ đến"><input type="time" value={form.arrival} onChange={(e) => setField('arrival', e.target.value)} required className={inputClass} /></Field>
        <Field label="Thời lượng"><input value={form.duration} onChange={(e) => setField('duration', e.target.value)} className={inputClass} placeholder="8h 30m" /></Field>
        <Field label="Giá vé"><input type="number" min="1000" step="1000" value={form.price} onChange={(e) => setField('price', e.target.value)} required className={inputClass} /></Field>
        <Field label="Tổng ghế"><input type="number" min="1" value={form.seats} onChange={(e) => setField('seats', e.target.value)} required className={inputClass} /></Field>
        <Field label="Ghế còn trống"><input type="number" min="0" value={form.seatsAvailable} onChange={(e) => setField('seatsAvailable', e.target.value)} required className={inputClass} /></Field>
      </div>

      <div className="mt-5 flex justify-end">
        <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60">
          <FaSave />
          {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo chuyến'}
        </button>
      </div>
    </form>
  )
}

function TripTable({ trips, loading, onEdit, onDelete }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-xl font-black text-slate-900">Danh sách chuyến xe</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Tuyến</th>
              <th className="px-5 py-3">Ngày/Giờ</th>
              <th className="px-5 py-3">Ghế</th>
              <th className="px-5 py-3">Giá</th>
              <th className="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center font-bold text-slate-500">Đang tải...</td></tr>
            ) : trips.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center font-bold text-slate-500">Chưa có chuyến xe</td></tr>
            ) : trips.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-100">
                <td className="px-5 py-4"><div className="font-black">{trip.from} → {trip.to}</div><div className="text-xs text-slate-500">{trip.bus}</div></td>
                <td className="px-5 py-4"><div className="font-bold">{trip.date}</div><div className="text-xs text-slate-500">{trip.departure} - {trip.arrival}</div></td>
                <td className="px-5 py-4">{trip.seatsAvailable}/{trip.seats}</td>
                <td className="px-5 py-4 font-black text-red-600">{formatCurrency(trip.price)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(trip)} className="rounded-xl border px-3 py-2 text-slate-600 hover:bg-slate-50"><FaEdit /></button>
                    <button onClick={() => onDelete(trip)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function BookingTable({ bookings, loading }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-xl font-black text-slate-900">Vé khách đã đặt</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Mã vé</th>
              <th className="px-5 py-3">Khách</th>
              <th className="px-5 py-3">Chuyến</th>
              <th className="px-5 py-3">Thanh toán</th>
              <th className="px-5 py-3">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center font-bold text-slate-500">Đang tải...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center font-bold text-slate-500">Chưa có vé</td></tr>
            ) : bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-mono text-xs">{booking.id}</td>
                <td className="px-5 py-4"><div className="font-bold">{booking.User?.fullName || '-'}</div><div className="text-xs text-slate-500">{booking.User?.email}</div></td>
                <td className="px-5 py-4">{booking.Trip?.from} → {booking.Trip?.to}</td>
                <td className="px-5 py-4">{booking.paymentStatus}</td>
                <td className="px-5 py-4 font-black text-red-600">{formatCurrency(booking.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}
