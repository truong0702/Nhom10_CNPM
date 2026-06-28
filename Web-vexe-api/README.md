# Vexe Bus Booking Backend API

Modern Node.js + Express backend for Vexe bus booking system with PostgreSQL database.

## Tech Stack

- **Framework**: Express.js 4.18
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Password Hashing**: bcryptjs
- **Runtime**: Node.js

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Sequelize database models
├── routes/          # API route definitions
├── services/        # Business logic
└── utils/           # Utility functions
server.js            # Main application entry
.env                 # Environment variables (local)
.env.example         # Environment template
package.json         # Dependencies
```

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Update .env with your PostgreSQL credentials
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=vexere_db
```

## Running the Server

```bash
# Development (with nodemon hot reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:bookingId` - Get booking details
- `POST /api/bookings/:bookingId/cancel` - Cancel booking (10% fee)
- `POST /api/bookings/:bookingId/exchange` - Exchange booking (5% fee)

## Key Features

### Booking Management
- Create bookings with seat selection
- Cancel bookings with 10% cancellation fee
- Exchange bookings with 5% exchange fee
- Automatic wallet deduction for fees

### Wallet System
- User wallet balance tracking
- Transaction history logging
- Automatic credit/debit management
- Fee deductions on cancel/exchange

### Security
- Password hashing with bcryptjs
- JWT-based authentication
- CORS enabled
- Input validation with Joi

## Environment Variables

See `.env.example` for all required variables:

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vexere_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
EMAIL_FROM="VeXe <noreply@vexe.local>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payment/vnpay-return
VNPAY_IPN_URL=http://localhost:5000/api/payments/vnpay/ipn
```

Booking confirmation emails are sent after a booking is created. If SMTP variables are
not configured, the backend prints an email preview to the console instead of failing
the booking request.

## Database Setup

Make sure PostgreSQL is installed and running:

```bash
# Create database (if not auto-created)
createdb vexere_db

# Models auto-sync on startup (development mode)
# Sequelize will create tables if they don't exist
```

## Error Handling

All errors return consistent JSON format:

```json
{
  "error": "Error message",
  "status": 400
}
```

## Development

```bash
# Watch for file changes and auto-reload
npm run dev

# Health check
curl http://localhost:5000/api/health
```

## Deployment

Ready for deployment on:
- Railway.app
- Render.com
- Heroku
- AWS EC2

Set production environment variables before deploying.

## License

MIT
