# Frontend-Backend Integration Guide

## Overview

Frontend Vexe app is now connected to Node.js/Express backend API.

## What Changed

### 1. **New API Client Services** (`src/services/`)
- `api.js` - Base API client wrapper with fetch
- `authApi.js` - Authentication endpoints
- `bookingApi.js` - Booking management endpoints
- `walletApi.js` - Wallet balance endpoints

### 2. **Updated Files**
- `src/context/AuthContext.jsx` - Now uses backend for login/register
- `src/utils/bookingsStorage.js` - Now calls booking API
- `src/utils/walletStorage.js` - Now fetches wallet from backend
- `.env.local` - Added `VITE_API_BASE_URL` for backend URL

### 3. **Authentication Flow**

When user registers or logs in:
1. Frontend sends credentials to `/api/auth/register` or `/api/auth/login`
2. Backend returns user data + JWT token
3. Token stored in `localStorage['vexere_token']`
4. Token sent in `Authorization: Bearer <token>` header for all requests
5. Backend validates token for protected endpoints

### 4. **Booking Flow**

When user books a ticket:
1. Frontend sends booking data to `/api/bookings`
2. Backend creates booking in PostgreSQL database
3. Backend returns booking with ID
4. Frontend stores locally or displays confirmation

When user cancels booking:
1. Frontend sends cancel request to `/api/bookings/:id/cancel`
2. Backend:
   - Calculates 10% cancellation fee
   - Deducts from wallet
   - Records transaction history
   - Returns updated booking
3. Frontend updates UI with new balance

When user exchanges booking:
1. Frontend sends exchange request to `/api/bookings/:id/exchange`
2. Backend:
   - Calculates 5% exchange fee
   - Handles price difference
   - Updates wallet
   - Returns updated booking
3. Frontend refreshes data

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend folder
cd d:\Web-vexe-api

# Install dependencies
npm install

# Setup database
# Make sure PostgreSQL is installed and running
# Create database: createdb vexere_db

# Update .env with your PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vexere_db
DB_USER=postgres
DB_PASSWORD=your_password

# Start backend
npm run dev
```

Backend should start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd d:\Web-vexe

# Install dependencies (if not already done)
npm install

# Start frontend
npm run dev
```

Frontend should start on `http://localhost:5173`

### 3. Test Connection

1. Open browser: `http://localhost:5173`
2. Try registering new account
3. Check browser console for any errors
4. Check backend logs for incoming requests

### 4. Environment Variables

Frontend uses `.env.local`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

If backend is on different host/port, update this URL.

## API Endpoints Being Used

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/profile` - Get user profile (with wallet)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Cancel with 10% fee
- `POST /api/bookings/:id/exchange` - Exchange with 5% fee

## Error Handling

All API calls wrapped in try-catch blocks. Errors logged to console.

### Common Issues

**1. CORS Error**
- Backend not running
- Frontend URL not in CORS whitelist
- Check backend `server.js` CORS configuration

**2. 401 Unauthorized**
- Token expired or invalid
- User not logged in
- Clear localStorage and try logging in again

**3. 404 Not Found**
- Endpoint doesn't exist
- Check API URL in `.env.local`

**4. Connection Refused**
- Backend not running
- Wrong API URL configured
- Check `http://localhost:5000/api/health`

## Testing with Postman

### Register
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User",
  "phone": "+84123456789"
}
```

### Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response includes:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "user"
  },
  "accessToken": "eyJhbGc..."
}
```

### Use Token in Requests
```
GET http://localhost:5000/api/auth/profile
Authorization: Bearer eyJhbGc...
```

## Next Steps

1. ✅ Create Trip API - `GET /api/trips` to fetch available trips
2. ✅ Add Payment API - Handle payment processing
3. ✅ Add Carrier API - Manage carrier information
4. ✅ Deploy frontend to Vercel
5. ✅ Deploy backend to Railway/Render

## File Structure

```
Frontend (d:\Web-vexe)
├── src/
│   ├── services/              [NEW]
│   │   ├── api.js             - Base client
│   │   ├── authApi.js         - Auth API
│   │   ├── bookingApi.js      - Booking API
│   │   └── walletApi.js       - Wallet API
│   ├── context/
│   │   └── AuthContext.jsx    [UPDATED]
│   └── utils/
│       ├── bookingsStorage.js [UPDATED]
│       └── walletStorage.js   [UPDATED]
├── .env.local                 [NEW]
└── ...

Backend (d:\Web-vexe-api)
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── server.js
├── package.json
├── .env
└── ...
```

## Debugging

1. **Check browser console** for JavaScript errors
2. **Check network tab** to see API requests/responses
3. **Check backend logs** for server-side errors
4. **Use Postman** to test endpoints directly
5. **Check `.env` files** for correct URLs

## Support

If you encounter issues:
1. Verify both frontend and backend are running
2. Check console logs in both frontend and browser
3. Verify `.env.local` has correct `VITE_API_BASE_URL`
4. Verify `.env` backend file has correct database credentials
5. Check that PostgreSQL is running and database exists
