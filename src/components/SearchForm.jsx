import { useEffect, useMemo, useRef, useState } from 'react'
import { FaArrowRight, FaBus, FaCalendar, FaChevronDown, FaClock, FaMapMarkerAlt, FaSearch, FaUsers } from 'react-icons/fa'
import { getLocations } from '../services/tripsApi.js'

export const HERO_BG =
  "linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.68) 55%, rgba(15,23,42,0.92) 100%), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=80')"

export default function SearchForm({ onSearch, disabled = false }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [passengers, setPassengers] = useState('1')
  const [error, setError] = useState('')
  const [locations, setLocations] = useState([])
  const [fromSuggestions, setFromSuggestions] = useState([])
  const [toSuggestions, setToSuggestions] = useState([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const fromRef = useRef(null)
  const toRef = useRef(null)

  useEffect(() => {
    getLocations().then(setLocations).catch(() => setLocations([]))
  }, [])

  useEffect(() => {
    const close = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) setShowFromSuggestions(false)
      if (toRef.current && !toRef.current.contains(event.target)) setShowToSuggestions(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const minDate = useMemo(() => {
    const today = new Date()
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')
  }, [])

  useEffect(() => {
    setFromSuggestions(filterLocations(locations, from))
    setShowFromSuggestions(Boolean(from.trim()))
  }, [from, locations])

  useEffect(() => {
    setToSuggestions(filterLocations(locations, to))
    setShowToSuggestions(Boolean(to.trim()))
  }, [to, locations])

  const submitSearch = (payload = { from, to, date, timeOfDay, vehicleType, passengers }) => {
    setError('')
    if (!payload.from || !payload.to || !payload.date) {
      setError('Vui lòng nhập đầy đủ điểm đi, điểm đến và ngày khởi hành.')
      return
    }
    if (payload.date < minDate) {
      setError('Vui lòng chọn ngày khởi hành từ hôm nay trở đi.')
      return
    }
    onSearch(payload)
  }

  const quickRoutes = [
    { from: 'Hà Nội', to: 'TP. Hồ Chí Minh' },
    { from: 'Hà Nội', to: 'Đà Nẵng' },
    { from: 'TP. Hồ Chí Minh', to: 'Cần Thơ' },
    { from: 'Huế', to: 'Hà Nội' },
  ]

  const chooseQuickRoute = (route) => {
    const next = { ...route, date: date || minDate, timeOfDay, vehicleType, passengers }
    setFrom(next.from)
    setTo(next.to)
    setDate(next.date)
    setTimeout(() => submitSearch(next), 80)
  }

  return (
    <section
      className="relative overflow-hidden bg-slate-950"
      style={{ backgroundImage: HERO_BG, backgroundSize: 'cover', backgroundPosition: 'center top' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(239,68,68,0.22),transparent_30%),radial-gradient(circle_at_10%_80%,rgba(14,165,233,0.18),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 lg:pb-12 lg:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
              Đặt vé xe nhanh
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-tight text-white lg:text-5xl">
              Tìm chuyến xe phù hợp trong vài giây
            </h1>
            <p className="mt-4 max-w-lg text-base font-semibold leading-7 text-slate-200">
              So sánh tuyến đường, giờ khởi hành, ghế trống và giá vé trên một giao diện rõ ràng.
            </p>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); submitSearch() }} className="rounded-[2rem] border border-white/15 bg-slate-950/88 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl lg:p-5">
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:flex xl:flex-row xl:flex-wrap xl:items-end">
              <LocationInput
                refEl={fromRef}
                label="Điểm đi"
                value={from}
                placeholder="Hà Nội, TP.HCM..."
                suggestions={fromSuggestions}
                showSuggestions={showFromSuggestions && fromSuggestions.length > 0}
                onFocus={() => from && setShowFromSuggestions(true)}
                onChange={setFrom}
                onSelect={(value) => { setFrom(value); setShowFromSuggestions(false) }}
              />

              <div className="hidden items-end justify-center pb-2 xl:flex">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-300">
                  <FaArrowRight />
                </div>
              </div>

              <LocationInput
                refEl={toRef}
                label="Điểm đến"
                value={to}
                placeholder="Đà Nẵng, Huế..."
                suggestions={toSuggestions}
                showSuggestions={showToSuggestions && toSuggestions.length > 0}
                onFocus={() => to && setShowToSuggestions(true)}
                onChange={setTo}
                onSelect={(value) => { setTo(value); setShowToSuggestions(false) }}
              />

              <Field label="Ngày" icon={<FaCalendar />}>
                <input
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={controlClass}
                />
              </Field>

              <SelectField
                label="Khung giờ"
                icon={<FaClock />}
                value={timeOfDay}
                onChange={setTimeOfDay}
                options={[
                  { value: '', label: 'Tất cả' },
                  { value: 'morning', label: 'Sáng' },
                  { value: 'afternoon', label: 'Chiều' },
                  { value: 'night', label: 'Tối' },
                ]}
              />

              <SelectField
                label="Loại xe"
                icon={<FaBus />}
                value={vehicleType}
                onChange={setVehicleType}
                options={[
                  { value: '', label: 'Tất cả' },
                  { value: 'sleeping', label: 'Xe giường nằm' },
                  { value: 'seating', label: 'Xe ghế ngồi' },
                ]}
              />

              <SelectField
                label="Khách"
                icon={<FaUsers />}
                value={passengers}
                onChange={setPassengers}
                options={[1, 2, 3, 4, 5, 6].map((count) => ({
                  value: String(count),
                  label: `${count} khách`,
                }))}
              />

              <div className="flex items-end md:col-span-2 xl:col-span-1 xl:min-w-[150px] xl:flex-none">
                <button
                  type="submit"
                  disabled={disabled}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-xl shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaSearch />
                  Tìm kiếm
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="mt-8">
          <div className="mb-3 text-sm font-black text-white">Tuyến đường phổ biến</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickRoutes.map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                type="button"
                onClick={() => chooseQuickRoute(route)}
                className="flex items-center justify-between rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-sm font-black text-slate-800 shadow-lg shadow-black/10 hover:bg-red-50 hover:text-red-700"
              >
                <span>{route.from}</span>
                <FaArrowRight className="text-slate-400" />
                <span>{route.to}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LocationInput({ refEl, label, value, placeholder, suggestions, showSuggestions, onFocus, onChange, onSelect }) {
  return (
    <Field refEl={refEl} label={label} icon={<FaMapMarkerAlt />}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
      />
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 min-w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1 shadow-2xl shadow-black/35 backdrop-blur-xl">
          {suggestions.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() => onSelect(location)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-100 transition hover:bg-white/10 hover:text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <FaMapMarkerAlt className="text-xs" />
              </span>
              <span className="truncate">{location}</span>
            </button>
          ))}
        </div>
      )}
    </Field>
  )
}

function SelectField({ label, icon, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((option) => option.value === value) || options[0]

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <Field refEl={ref} label={label} icon={icon}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${controlClass} flex items-center justify-between gap-3 text-left`}
      >
        <span className="min-w-0 truncate">{selected.label}</span>
        <FaChevronDown className={`shrink-0 text-xs text-slate-300 transition ${open ? 'rotate-180 text-red-300' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1 shadow-2xl shadow-black/35 backdrop-blur-xl">
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                  active ? 'bg-red-500/18 text-white ring-1 ring-red-400/30' : 'text-slate-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </Field>
  )
}

const controlClass = 'h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-white outline-none transition [color-scheme:dark] placeholder:text-slate-500 focus:border-red-400 focus:bg-white/[0.09] focus:ring-4 focus:ring-red-500/15'

function Field({ refEl, label, icon, children }) {
  return (
    <div ref={refEl} className="relative min-w-0 md:min-w-[0] xl:min-w-[140px] xl:flex-1">
      <label className="mb-2 flex min-h-8 items-center gap-2 text-[11px] font-black uppercase leading-4 tracking-wide text-slate-300">
        <span className="shrink-0 text-red-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}

function filterLocations(locations, query) {
  if (!query.trim()) return []
  const normalizedQuery = normalize(query)
  return locations.filter((location) => normalize(location).includes(normalizedQuery)).slice(0, 8)
}

function normalize(value = '') {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
