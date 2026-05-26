import http from 'http'
import { randomUUID } from 'crypto'

const PORT = process.env.PORT || 5000

const trips = [
  { id: 'trip-1', bus: 'Hanoi - Saigon', from: 'Hà Nội', to: 'Sài Gòn', departure: '08:00', arrival: '20:00', duration: '12h', seats: 40, price: 450000, image: '/img/bus1.jpg', rating: 4.6, reviews: 120 },
  { id: 'trip-2', bus: 'Hanoi - Da Nang', from: 'Hà Nội', to: 'Đà Nẵng', departure: '06:00', arrival: '14:00', duration: '8h', seats: 32, price: 300000, image: '/img/bus2.jpg', rating: 4.4, reviews: 88 },
]

const users = new Map()
const bookings = new Map()

function send(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(body)
}

function parseJSON(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const parts = url.pathname.replace(/^\//, '').split('/')

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    return res.end()
  }

  try {
    // Health
    if (url.pathname === '/api/health' && req.method === 'GET') {
      return send(res, 200, { message: 'Server is running (mock)' })
    }

    // Trips
    if (url.pathname === '/api/trips' && req.method === 'GET') {
      return send(res, 200, { data: trips })
    }

    if (parts[0] === 'api' && parts[1] === 'trips' && parts[2]) {
      const id = parts[2]
      const trip = trips.find((t) => t.id === id) || null
      return send(res, trip ? 200 : 404, { data: trip })
    }

    // Auth register/login/profile
    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseJSON(req)
      const id = randomUUID()
      const user = { id, email: body.email, fullName: body.fullName || body.name || 'User', phone: body.phone || '' }
      users.set(id, { ...user, password: body.password })
      const token = `mock-${id}`
      return send(res, 200, { accessToken: token, user })
    }

    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJSON(req)
      // find user by email
      const found = [...users.values()].find((u) => u.email === body.email)
      if (!found) {
        // auto-create for convenience
        const id = randomUUID()
        const user = { id, email: body.email, fullName: 'Demo User', phone: '' }
        users.set(id, { ...user, password: body.password })
        const token = `mock-${id}`
        return send(res, 200, { accessToken: token, user })
      }
      const token = `mock-${found.id}`
      return send(res, 200, { accessToken: token, user: { id: found.id, email: found.email, fullName: found.fullName, phone: found.phone } })
    }

    if (url.pathname === '/api/auth/profile' && req.method === 'GET') {
      const auth = req.headers.authorization || ''
      const id = (auth.split('-')[1]) || null
      const u = id ? users.get(id) : null
      if (!u) return send(res, 401, { error: 'Unauthorized' })
      return send(res, 200, { data: { id: u.id, email: u.email, fullName: u.fullName, phone: u.phone } })
    }

    // Bookings
    if (url.pathname === '/api/bookings' && req.method === 'POST') {
      const body = await parseJSON(req)
      const id = randomUUID()
      const booking = { id, tripId: body.tripId || null, items: body.items || [], total: body.total || 0, status: 'pending', createdAt: new Date().toISOString() }
      bookings.set(id, booking)
      return send(res, 200, { booking })
    }

    if (url.pathname === '/api/bookings' && req.method === 'GET') {
      return send(res, 200, { bookings: [...bookings.values()] })
    }

    if (parts[0] === 'api' && parts[1] === 'bookings' && parts[2]) {
      const id = parts[2]
      if (req.method === 'GET') {
        const b = bookings.get(id)
        return send(res, b ? 200 : 404, { booking: b })
      }

      if (parts[3] === 'cancel' && req.method === 'POST') {
        const b = bookings.get(id)
        if (!b) return send(res, 404, { error: 'Not found' })
        b.status = 'cancelled'
        bookings.set(id, b)
        return send(res, 200, { booking: b })
      }

      if (parts[3] === 'exchange' && req.method === 'POST') {
        const b = bookings.get(id)
        if (!b) return send(res, 404, { error: 'Not found' })
        // naive: replace items
        const body = await parseJSON(req)
        b.items = body.toItems || b.items
        bookings.set(id, b)
        return send(res, 200, { booking: b })
      }

      if (parts[3] === 'status' && req.method === 'PUT') {
        const body = await parseJSON(req)
        const b = bookings.get(id)
        if (!b) return send(res, 404, { error: 'Not found' })
        b.status = body.status || b.status
        bookings.set(id, b)
        return send(res, 200, { booking: b })
      }
    }

    // fallback
    send(res, 404, { error: 'Not found (mock)' })
  } catch (e) {
    console.error(e)
    send(res, 500, { error: 'Internal mock error' })
  }
})

server.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`)
})
