import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import TripList from '../components/TripList'
import { searchTrips } from '../services/tripsApi.js'

export default function Home({ onProceedToCheckout }) {
  const [trips, setTrips] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [searchParams] = useSearchParams();

  // Auto-search when URL params change
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    
    if (from && to && date) {
      handleSearch({ from, to, date });
    }
  }, [searchParams]);

  const handleSearch = async (searchData) => {
    // Validate không cho từm ngày quá khứ quả khứ (chỉ bypass)
    const { date } = searchData || {}

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const minDate = `${yyyy}-${mm}-${dd}`

    if (!date || date < minDate) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSearched(false)

      const results = await searchTrips(searchData.from, searchData.to, date)

      setTrips(results)
      setSearched(true)
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to search trips. Please try again.')
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 home-hero">
      <SearchForm onSearch={handleSearch} disabled={loading} />

      <div className="relative z-10">
        {loading && (
          <div className="flex-1 flex items-center justify-center min-h-96">
            <p className="text-gray-300 text-lg">Loading trips...</p>
          </div>
        )}
        {error && (
          <div className="flex-1 flex items-center justify-center min-h-96">
            <p className="text-red-400 text-lg">{error}</p>
          </div>
        )}
        {searched && !loading && !error && <TripList trips={trips} onProceedToCheckout={onProceedToCheckout} />}
        {!searched && !loading && !error && (
          <div className="flex-1 flex items-center justify-center min-h-96">
            <p className="text-gray-300 text-lg">Tìm khách hàng chuyến xe để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  )
}
