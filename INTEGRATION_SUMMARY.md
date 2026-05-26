# Frontend-Backend Integration Summary

## ✅ Completed Tasks

### Frontend Services Layer (NEW)
✅ `src/services/api.js` - Base API client with fetch wrapper
- Handles authorization headers (Bearer token)
- GET, POST, PUT, DELETE methods
- Automatic error handling
- Token management

✅ `src/services/authApi.js` - Authentication service
- register(email, password, fullName, phone)
- login(email, password)
- getProfile()
- logout()

✅ `src/services/bookingApi.js` - Booking service
- createBooking(tripId, items, total)
- getMyBookings()
- getBookingById(bookingId)
- cancelBooking(bookingId, reason) - with 10% fee
- exchangeBooking(bookingId, toItems, note) - with 5% fee

✅ `src/services/walletApi.js` - Wallet service
- getBalance() - fetch from /auth/profile
- getHistory() - from /bookings endpoint
- getWalletBalance() - shorthand

### Updated Frontend Files
✅ `src/context/AuthContext.jsx`
- Replaced localStorage-based auth with API calls
- Automatic token persistence in localStorage
- Error handling & loading states
- Initialize auth on app mount

✅ `src/utils/bookingsStorage.js`
- All functions now call booking API
- createBookingFromCart() → POST /api/bookings
- getBookingsByUser() → GET /api/bookings
- cancelBooking() → POST /api/bookings/:id/cancel
- exchangeBooking() → POST /api/bookings/:id/exchange

✅ `src/utils/walletStorage.js`
- getWalletBalance() → GET /auth/profile
- addWalletCredit() → Fetch updated balance
- getWalletHistory() → GET /bookings

### Configuration
✅ `.env.local` - Frontend environment variables
- VITE_API_BASE_URL=http://localhost:5000/api

### Documentation
✅ `INTEGRATION_GUIDE.md` - Complete setup & usage guide

## 📋 Quick Start Checklist

### Phase 1: Backend Setup (DO FIRST)
```
☐ Install PostgreSQL (if not installed)
☐ Create database: createdb vexere_db
☐ Navigate to: d:\Web-vexe-api
☐ Run: npm install
☐ Update .env with database credentials
  - DB_HOST=localhost
  - DB_USER=postgres
  - DB_PASSWORD=your_password
  - DB_NAME=vexere_db
☐ Run: npm run dev
☐ Verify: http://localhost:5000/api/health (should show 200 OK)
```

### Phase 2: Frontend Setup
```
☐ Navigate to: d:\Web-vexe
☐ Run: npm install (if dependencies not installed)
☐ Run: npm run dev
☐ Verify: http://localhost:5173 (should load app)
☐ Check browser console for any errors
```

### Phase 3: Testing
```
☐ Test registration at /register
  - Fill form: email, password, fullName
  - Should create user in PostgreSQL
  - Should redirect to home after success
  
☐ Test login at /login
  - Use credentials from registration
  - Token should be stored in localStorage
  - Should redirect to home
  
☐ Test booking creation
  - Select trip
  - Select seat
  - Complete checkout
  - Check backend logs for booking creation
  
☐ Test cancellation at /bookings
  - Click cancel on ticket
  - Confirm reason
  - Should deduct 10% fee
  - Check wallet balance updated
  
☐ Test exchange
  - Click exchange on ticket
  - Select new trip & seat
  - Confirm
  - Should deduct 5% fee
```

## 🔄 Data Flow

### Registration Flow
```
Frontend Form
    ↓
authApi.register()
    ↓
POST /api/auth/register
    ↓
Backend creates user + wallet
    ↓
Returns user data + JWT token
    ↓
Frontend: setToken() → localStorage
    ↓
AuthContext updated with user
```

### Booking Creation Flow
```
Cart items
    ↓
bookingApi.createBooking()
    ↓
POST /api/bookings
    ↓
Backend creates booking in DB
    ↓
Returns booking with ID
    ↓
Frontend displays confirmation
```

### Cancellation Flow
```
Cancel button clicked
    ↓
bookingApi.cancelBooking(id, reason)
    ↓
POST /api/bookings/:id/cancel
    ↓
Backend:
- Calculates fee = 10% of total
- Deducts from wallet
- Records transaction
- Returns updated booking
    ↓
Frontend: Fetch updated bookings
    ↓
Display new wallet balance
```

## 🔗 API Integration Map

| Frontend Function | API Endpoint | Method | Protected |
|---|---|---|---|
| authApi.register() | /auth/register | POST | ❌ |
| authApi.login() | /auth/login | POST | ❌ |
| authApi.getProfile() | /auth/profile | GET | ✅ |
| bookingApi.createBooking() | /bookings | POST | ✅ |
| bookingApi.getMyBookings() | /bookings | GET | ✅ |
| bookingApi.getBookingById() | /bookings/:id | GET | ✅ |
| bookingApi.cancelBooking() | /bookings/:id/cancel | POST | ✅ |
| bookingApi.exchangeBooking() | /bookings/:id/exchange | POST | ✅ |
| walletApi.getBalance() | /auth/profile | GET | ✅ |

## 📊 Token Management

1. **Storage**: localStorage['vexere_token']
2. **Sent as**: Authorization: Bearer <token>
3. **When set**: After successful login/register
4. **When cleared**: On logout or 401 error
5. **Auto-restore**: On app initialization

## 🐛 Common Issues & Fixes

### CORS Error
```
Error: Failed to fetch from backend
Fix:
- Check backend is running: npm run dev
- Check URL in .env.local
- Check backend CORS config in server.js
```

### 401 Unauthorized
```
Error: Invalid token
Fix:
- Clear localStorage
- Login again
- Check token in Network tab
```

### 404 Not Found
```
Error: Endpoint not found
Fix:
- Verify API_BASE_URL in .env.local
- Check API_DOCS.md for endpoint names
- Test with Postman
```

### Connection Refused
```
Error: Cannot reach backend
Fix:
- Ensure backend running: npm run dev in Web-vexe-api
- Ensure on port 5000
- Check firewall settings
```

## 📝 Next Implementation Tasks

### Immediate (Optional but recommended)
1. Add Trip API endpoint to backend
   - GET /api/trips
   - Filter by route/date
   - Update frontend to fetch from backend

2. Add Payment API endpoint
   - Process payment integration
   - Update booking payment status

3. Add Carrier API endpoint
   - Fetch carrier details
   - Rating & reviews

### For Production
1. Setup refresh token mechanism
2. Add rate limiting
3. Setup API logging
4. Add error tracking (Sentry)
5. Setup CI/CD pipeline
6. Deploy to Railway/Render
7. Setup domain & SSL

## 📞 Support

**File Structure:**
- Frontend: `d:\Web-vexe`
- Backend: `d:\Web-vexe-api`

**Documentation:**
- Frontend setup: `INTEGRATION_GUIDE.md`
- Backend setup: `d:\Web-vexe-api\README.md`
- API docs: `d:\Web-vexe-api\API_DOCS.md`

**Debug:**
1. Browser console (Ctrl+Shift+I)
2. Network tab to see API calls
3. Backend logs in terminal
4. Check .env files for URLs

---

**Status**: ✅ Frontend-Backend integration complete and ready for testing!
