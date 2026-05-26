import { useMemo, useState } from 'react'
import SearchForm from '../components/SearchForm.jsx'
import TripList from '../components/TripList.jsx'

export default function Trips({ trips, onAddToCart, onCheckout }) {
  const [filtered, setFiltered] = useState(trips)

  const shown = useMemo(() => filtered, [filtered])

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Explore</div>
          <h2 className="text-2xl font-bold">Trips</h2>
        </div>
        <button
          className="hidden sm:inline-flex px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium"
          onClick={onCheckout}
        >
          Go to checkout
        </button>
      </div>

      <SearchForm trips={trips} onFiltered={setFiltered} />

      <TripList trips={shown} onAddToCart={onAddToCart} />

      <div className="sm:hidden">
        <button
          className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-medium"
          onClick={onCheckout}
        >
          Go to checkout
        </button>
      </div>
    </section>
  )
}

