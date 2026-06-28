import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaBan, FaEdit, FaPlus, FaSave, FaTrash } from 'react-icons/fa'
import carrierApi from '../services/carrierApi'

const emptyForm = {
  from: '',
  to: '',
  departure: '',
  arrival: '',
  arrivalDate: '',
  duration: '',
  date: '',
  bus: '',
  vehicleType: 'sleeping',
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
      const tripResponse = await carrierApi.getTrips()
      setCarrier(tripResponse.carrier || null)
      setTrips(tripResponse.trips || [])

      try {
        const bookingResponse = await carrierApi.getBookings()
        setCarrier((current) => current || bookingResponse.carrier || null)
        setBookings(bookingResponse.bookings || [])
      } catch (bookingError) {
        setBookings([])
        setError(bookingError.message || 'Không thể tải danh sách vé đã đặt')
      }
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
    const commission = paidBookings.reduce((sum, booking) => sum + getCommissionAmount(booking), 0)
    const carrierRevenue = paidBookings.reduce((sum, booking) => sum + getCarrierRevenue(booking), 0)
    return {
      trips: trips.length,
      bookings: bookings.length,
      paid: paidBookings.length,
      revenue,
      commission,
      carrierRevenue,
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
      if (field === 'date' && !next.arrivalDate) next.arrivalDate = value
      if (field === 'seats' && !editingId) next.seatsAvailable = value
      next.duration = calculateDuration(next.date, next.departure, next.arrivalDate, next.arrival)
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
      arrivalDate: trip.arrivalDate || trip.date || '',
      duration: trip.duration || calculateDuration(trip.date, trip.departure, trip.arrivalDate || trip.date, trip.arrival),
      date: trip.date || '',
      bus: trip.bus || '',
      vehicleType: trip.vehicleType || 'sleeping',
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
        duration: calculateDuration(form.date, form.departure, form.arrivalDate, form.arrival),
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

  const handleStatusChange = async (trip, status) => {
    setLoading(true)
    setError('')
    try {
      await carrierApi.setTripStatus(trip.id, status)
      await load()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái chuyến xe')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (trip) => {
    if (!window.confirm(`Hủy chuyến ${trip.from} → ${trip.to} ngày ${trip.date}?`)) return
    setLoading(true)
    setError('')
    try {
      await carrierApi.cancelTrip(trip.id)
      await load()
    } catch (err) {
      setError(err.message || 'Không thể hủy chuyến xe')
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
            carrier={carrier}
            editingId={editingId}
            saving={saving}
            onSubmit={handleSubmit}
            onReset={resetForm}
            setField={setField}
          />
          <TripTable
            trips={trips}
            loading={loading}
            onEdit={startEdit}
            onDelete={handleDelete}
            onCancel={handleCancel}
            onStatusChange={handleStatusChange}
          />
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
    { label: 'Doanh thu gộp', value: formatCurrency(stats.revenue) },
    { label: 'Chiết khấu 10%', value: formatCurrency(stats.commission) },
    { label: 'Nhà xe thực nhận', value: formatCurrency(stats.carrierRevenue) },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black uppercase tracking-wide text-slate-500">{card.label}</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{loading ? '-' : card.value}</div>
        </div>
      ))}
      {carrier?.status === 'inactive' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800 md:col-span-2 xl:col-span-6">
          Nhà xe đang ở trạng thái không hoạt động. Vui lòng liên hệ admin để mở lại trước khi tạo chuyến mới.
        </div>
      )}
    </section>
  )
}

function TripForm({ form, carrier, editingId, saving, onSubmit, onReset, setField }) {
  const canManageTrips = Boolean(carrier?.approved && carrier?.status === 'active')

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

      {!canManageTrips && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Tài khoản nhà xe đang chờ admin duyệt. Sau khi được duyệt và kích hoạt, bạn mới có thể tạo chuyến xe.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tên xe"><input value={form.bus} onChange={(e) => setField('bus', e.target.value)} required className={inputClass} /></Field>
        <Field label="Loại xe">
          <select value={form.vehicleType} onChange={(e) => setField('vehicleType', e.target.value)} required className={inputClass}>
            <option value="sleeping">Xe giường nằm</option>
            <option value="seating">Xe ghế ngồi</option>
          </select>
        </Field>
        <Field label="Điểm đi"><input value={form.from} onChange={(e) => setField('from', e.target.value)} required className={inputClass} /></Field>
        <Field label="Điểm đến"><input value={form.to} onChange={(e) => setField('to', e.target.value)} required className={inputClass} /></Field>
        <Field label="Ngày đi"><input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required className={inputClass} /></Field>
        <Field label="Ngày đến"><input type="date" value={form.arrivalDate} min={form.date || undefined} onChange={(e) => setField('arrivalDate', e.target.value)} required className={inputClass} /></Field>
        <Field label="Giờ khởi hành"><input type="time" value={form.departure} onChange={(e) => setField('departure', e.target.value)} required className={inputClass} /></Field>
        <Field label="Giờ đến"><input type="time" value={form.arrival} onChange={(e) => setField('arrival', e.target.value)} required className={inputClass} /></Field>
        <Field label="Thời lượng"><input value={form.duration} readOnly className={`${inputClass} bg-slate-50 text-slate-500`} placeholder="Tự động tính" /></Field>
        <Field label="Giá vé"><input type="number" min="1000" step="1000" value={form.price} onChange={(e) => setField('price', e.target.value)} required className={inputClass} /></Field>
        <Field label="Số chỗ"><input type="number" min="1" value={form.seats} onChange={(e) => setField('seats', e.target.value)} required className={inputClass} /></Field>
        <Field label="Ghế còn trống"><input type="number" min="0" value={form.seatsAvailable} onChange={(e) => setField('seatsAvailable', e.target.value)} required className={inputClass} /></Field>
      </div>

      <div className="mt-5 flex justify-end">
        <button disabled={saving || !canManageTrips} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
          <FaSave />
          {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo chuyến'}
        </button>
      </div>
    </form>
  )
}

function TripTable({ trips, loading, onEdit, onDelete, onCancel, onStatusChange }) {
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
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3">Giá</th>
              <th className="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center font-bold text-slate-500">Đang tải...</td></tr>
            ) : trips.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center font-bold text-slate-500">Chưa có chuyến xe</td></tr>
            ) : trips.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <div className="font-black">{trip.from} → {trip.to}</div>
                  <div className="text-xs text-slate-500">{trip.bus} · {getVehicleTypeLabel(trip.vehicleType)}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold">{trip.date}{trip.arrivalDate && trip.arrivalDate !== trip.date ? ` → ${trip.arrivalDate}` : ''}</div>
                  <div className="text-xs text-slate-500">{trip.departure} - {trip.arrival} · {trip.duration}</div>
                </td>
                <td className="px-5 py-4">{trip.seatsAvailable}/{trip.seats}</td>
                <td className="px-5 py-4">
                  <select
                    value={trip.status || 'active'}
                    onChange={(event) => onStatusChange(trip, event.target.value)}
                    disabled={loading}
                    className={`h-9 rounded-xl border px-3 text-xs font-black outline-none ${getStatusClass(trip.status)}`}
                    aria-label="Đổi trạng thái chuyến"
                  >
                    <option value="active">Đang chạy</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td className="px-5 py-4 font-black text-red-600">{formatCurrency(trip.price)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(trip)} className="rounded-xl border px-3 py-2 text-slate-600 hover:bg-slate-50"><FaEdit /></button>
                    <button
                      onClick={() => onCancel(trip)}
                      disabled={(trip.status || 'active') === 'cancelled'}
                      className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <FaBan />
                    </button>
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
              <th className="px-5 py-3">Chiết khấu</th>
              <th className="px-5 py-3">Nhà xe nhận</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center font-bold text-slate-500">Đang tải...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center font-bold text-slate-500">Chưa có vé</td></tr>
            ) : bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-mono text-xs">{booking.id}</td>
                <td className="px-5 py-4"><div className="font-bold">{booking.User?.fullName || '-'}</div><div className="text-xs text-slate-500">{booking.User?.email}</div></td>
                <td className="px-5 py-4">{booking.Trip?.from} → {booking.Trip?.to}</td>
                <td className="px-5 py-4">{getPaymentStatusLabel(booking.paymentStatus)}</td>
                <td className="px-5 py-4 font-black text-red-600">{formatCurrency(booking.total)}</td>
                <td className="px-5 py-4 font-bold text-slate-700">{booking.paymentStatus === 'paid' ? formatCurrency(getCommissionAmount(booking)) : '-'}</td>
                <td className="px-5 py-4 font-black text-emerald-700">{booking.paymentStatus === 'paid' ? formatCurrency(getCarrierRevenue(booking)) : '-'}</td>
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

function getStatusClass(status = 'active') {
  if (status === 'cancelled') return 'border-red-100 bg-red-50 text-red-700'
  if (status === 'inactive') return 'border-amber-100 bg-amber-50 text-amber-700'
  return 'border-emerald-100 bg-emerald-50 text-emerald-700'
}

function calculateDuration(date, departure, arrivalDate, arrival) {
  if (!date || !departure || !arrivalDate || !arrival) return ''
  const start = new Date(`${date}T${departure}`)
  const end = new Date(`${arrivalDate}T${arrival}`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return ''

  const totalMinutes = Math.round((end - start) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

function getVehicleTypeLabel(vehicleType) {
  return vehicleType === 'sleeping' ? 'Xe giường nằm' : 'Xe ghế ngồi'
}

function getPaymentStatusLabel(status) {
  if (status === 'paid') return 'Đã thanh toán'
  if (status === 'failed') return 'Thanh toán thất bại'
  return 'Chờ xác nhận'
}

function getCommissionAmount(booking) {
  if (booking.paymentStatus !== 'paid') return 0
  const total = Number(booking.total || 0)
  return Number(booking.commissionAmount || Math.round(total * 0.1))
}

function getCarrierRevenue(booking) {
  if (booking.paymentStatus !== 'paid') return 0
  const total = Number(booking.total || 0)
  return Number(booking.carrierRevenue || Math.max(total - getCommissionAmount(booking), 0))
}
