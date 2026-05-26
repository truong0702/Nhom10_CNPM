# Vexe Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require:
```
Authorization: Bearer <accessToken>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+84123456789"
}
```

Response (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### 2. Login
**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### 3. Get Profile
**GET** `/auth/profile`

Response (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+84123456789",
    "avatar": "url",
    "role": "user"
  },
  "wallet": {
    "balance": 0
  }
}
```

---

## Booking Endpoints

### 1. Create Booking
**POST** `/bookings`

Request:
```json
{
  "tripId": "uuid",
  "items": [
    {
      "id": "trip-id",
      "title": "Hà Nội - Hải Phòng",
      "price": 150000,
      "qty": 1,
      "vehicleType": "seating",
      "seatType": "standard",
      "selectedSeatLabels": ["A1"]
    }
  ],
  "total": 150000
}
```

Response (201):
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "uuid",
    "userId": "uuid",
    "tripId": "uuid",
    "items": [...],
    "total": 150000,
    "paymentStatus": "pending",
    "cancelStatus": "active",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Get My Bookings
**GET** `/bookings`

Response (200):
```json
{
  "bookings": [
    {
      "id": "uuid",
      "userId": "uuid",
      "tripId": "uuid",
      "items": [...],
      "total": 150000,
      "paymentStatus": "pending",
      "cancelStatus": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "wallet": {
    "balance": 0
  }
}
```

### 3. Get Booking Details
**GET** `/bookings/:bookingId`

Response (200):
```json
{
  "booking": {
    "id": "uuid",
    "userId": "uuid",
    "tripId": "uuid",
    "items": [...],
    "total": 150000,
    "paymentStatus": "pending",
    "cancelStatus": "active",
    "exchanges": [],
    "history": [],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 4. Cancel Booking
**POST** `/bookings/:bookingId/cancel`

Request:
```json
{
  "reason": "Change of plans"
}
```

Response (200):
```json
{
  "message": "Booking canceled successfully",
  "booking": {
    "id": "uuid",
    "cancelStatus": "canceled",
    "canceledAt": "2024-01-15T11:00:00Z",
    "cancelReason": "Change of plans",
    "total": 150000
  }
}
```

**Fees Applied:**
- Cancel Fee: 10% of total = 15,000
- Refund Amount: 90% of total = 135,000

### 5. Exchange Booking
**POST** `/bookings/:bookingId/exchange`

Request:
```json
{
  "toItems": [
    {
      "id": "new-trip-id",
      "title": "Hà Nội - Hải Phòng (Evening)",
      "price": 160000,
      "qty": 1,
      "vehicleType": "seating",
      "seatType": "vip",
      "selectedSeatLabels": ["B2"]
    }
  ],
  "note": "Want a different time"
}
```

Response (200):
```json
{
  "message": "Booking exchanged successfully",
  "booking": {
    "id": "uuid",
    "items": [...],
    "total": 160000,
    "exchanges": [
      {
        "oldItems": [...],
        "oldTotal": 150000,
        "newItems": [...],
        "newTotal": 160000,
        "exchangeFee": 7500,
        "priceDifference": 10000,
        "note": "Want a different time",
        "timestamp": "2024-01-15T11:30:00Z"
      }
    ]
  }
}
```

**Fees Applied:**
- Exchange Fee: 5% of old total = 7,500
- Price Difference: new total - old total = +10,000
- Total Deducted from Wallet: 17,500

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "email is required, password must be at least 6 characters"
}
```

### Authentication Error (401)
```json
{
  "error": "Access token required"
}
```

### Authorization Error (403)
```json
{
  "error": "Invalid or expired token"
}
```

### Not Found (404)
```json
{
  "error": "Route not found"
}
```

### Server Error (500)
```json
{
  "error": "Internal Server Error"
}
```

---

## Fee Structure

| Operation | Fee | Deducted From |
|-----------|-----|--------------|
| Cancel Booking | 10% | Wallet |
| Exchange Booking | 5% | Wallet |
| Price Increase | Difference | Wallet |
| Price Decrease | Difference | Refunded to Wallet |

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "phone": "+84123456789"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_token>"
```

### Get Bookings
```bash
curl -X GET http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <your_token>"
```

---

## Next Steps

1. Install PostgreSQL
2. Create database: `createdb vexere_db`
3. Update `.env` with database credentials
4. Run: `npm install` then `npm run dev`
5. Test endpoints using cURL or Postman
