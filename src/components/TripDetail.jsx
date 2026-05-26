export default function TripDetail({ trip }) {
  if (!trip) return null
  return (
    <div className="border rounded-2xl bg-white p-4 shadow-sm">
      <div className="font-semibold text-xl">{trip.title}</div>
      <div className="text-sm text-slate-500">{trip.location}</div>
      <p className="mt-3 text-sm text-slate-700">{trip.description}</p>
    </div>
  )
}

