import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './src/config/database.js';
import bcrypt from 'bcryptjs';
import authRoutes from './src/routes/auth.js';
import bookingRoutes from './src/routes/booking.js';
import tripRoutes from './src/routes/trip.js';
import walletRoutes from './src/routes/wallet.js';
import adminRoutes from './src/routes/admin.js';
import paymentRoutes from './src/routes/payment.js';
import carrierRoutes from './src/routes/carrier.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { Carrier, Trip, User, Wallet } from './src/models/index.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow both localhost:5173 and :5174
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/carrier', carrierRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const formatDate = (date) => date.toISOString().split('T')[0];

const seedDemoData = async () => {
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const carrierDefaults = {
    name: 'Vexe Express',
    email: 'carrier@vexe.local',
    phone: '0900000000',
    rating: 4.8,
    reviews: 128,
  };

  const [carrier] = await Carrier.findOrCreate({
    where: { email: carrierDefaults.email },
    defaults: carrierDefaults,
  });

  if (!carrier) {
    throw new Error('Unable to seed carrier');
  }

  const carrierPasswordHash = await bcrypt.hash('123456', 10);
  const [carrierUser, carrierUserCreated] = await User.findOrCreate({
    where: { email: 'carrier@vexe.local' },
    defaults: {
      email: 'carrier@vexe.local',
      password: carrierPasswordHash,
      fullName: 'Vexe Express',
      phone: '0900000000',
      role: 'carrier',
      isVerified: true,
    },
  });

  if (!carrierUserCreated) {
    await carrierUser.update({
      password: carrierPasswordHash,
      fullName: 'Vexe Express',
      phone: '0900000000',
      role: 'carrier',
      isVerified: true,
    });
  }

  await carrier.update({
    ownerUserId: carrierUser.id,
    approved: true,
    status: 'active',
  });

  const tripSeeds = [
    { from: 'Hà Nội', to: 'Đà Nẵng', departure: '07:00', arrival: '15:30', duration: '8h 30m', date: today, bus: 'Limousine 24 chỗ', seats: 20, seatsAvailable: 18, price: 450000, rating: 4.8, reviews: 64, image: '/images/trips/hanoi-danang.jpg' },
    { from: 'Hà Nội', to: 'TP. Hồ Chí Minh', departure: '18:00', arrival: '08:00', duration: '14h 00m', date: today, bus: 'Giường nằm 40 chỗ', seats: 40, seatsAvailable: 32, price: 780000, rating: 4.7, reviews: 92, image: '/images/trips/hanoi-hcm.jpg' },
    { from: 'TP. Hồ Chí Minh', to: 'Cần Thơ', departure: '09:30', arrival: '12:00', duration: '2h 30m', date: tomorrow, bus: 'Ghế ngồi 29 chỗ', seats: 29, seatsAvailable: 21, price: 180000, rating: 4.6, reviews: 48, image: '/images/trips/hcm-cantho.jpg' },
  ];

  for (const tripSeed of tripSeeds) {
    const [trip, created] = await Trip.findOrCreate({
      where: {
        carrierId: carrier.id,
        from: tripSeed.from,
        to: tripSeed.to,
        date: tripSeed.date,
        departure: tripSeed.departure,
      },
      defaults: {
        carrierId: carrier.id,
        ...tripSeed,
      },
    });

    if (!created) {
      await trip.update({
        carrierId: carrier.id,
        ...tripSeed,
      });
    }
  }

  const demoPasswordHash = await bcrypt.hash('123456', 10);
  const [user, userCreated] = await User.findOrCreate({
    where: { email: 'demo@vexe.local' },
    defaults: {
      email: 'demo@vexe.local',
      password: demoPasswordHash,
      fullName: 'Demo User',
      phone: '0900000001',
      role: 'user',
      isVerified: true,
    },
  });

  if (!userCreated) {
    await user.update({
      password: demoPasswordHash,
      fullName: 'Demo User',
      phone: '0900000001',
      role: 'user',
      isVerified: true,
    });
  }


  const adminPasswordHash = await bcrypt.hash('123456', 10);
  const [adminUser, adminCreated] = await User.findOrCreate({
    where: { email: 'admin@vexe.local' },
    defaults: {
      email: 'admin@vexe.local',
      password: adminPasswordHash,
      fullName: 'Admin User',
      phone: '0900000002',
      role: 'admin',
      isVerified: true,
    },
  });

  if (!adminCreated) {
    await adminUser.update({
      password: adminPasswordHash,
      fullName: 'Admin User',
      phone: '0900000002',
      role: 'admin',
      isVerified: true,
    });
  }
  const [wallet, walletCreated] = await Wallet.findOrCreate({
    where: { userId: user.id },
    defaults: {
      userId: user.id,
      balance: 1000000,
      history: [],
    },
  });

  if (!walletCreated) {
    await wallet.update({
      balance: 1000000,
      history: wallet.history || [],
    });
  }

  console.log('✓ Demo data ready');
};

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // Sync models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ Database models synced');

    await seedDemoData();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
      console.log(`✓ CORS enabled for: localhost:5173, localhost:5174, localhost:3000`);
      console.log(`\nAvailable routes:`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  GET    /api/auth/profile`);
      console.log(`  PUT    /api/auth/profile`);
      console.log(`  POST   /api/auth/change-password`);
      console.log(`  POST   /api/auth/forgot-password`);
      console.log(`  POST   /api/auth/reset-password`);
      console.log(`  POST   /api/bookings`);
      console.log(`  GET    /api/bookings`);
      console.log(`  GET    /api/bookings/:bookingId`);
      console.log(`  POST   /api/bookings/:bookingId/cancel`);
      console.log(`  POST   /api/bookings/:bookingId/exchange`);
      console.log(`  PUT    /api/bookings/:bookingId/status`);
      console.log(`  GET    /api/trips`);
      console.log(`  GET    /api/trips/locations`);
      console.log(`  GET    /api/trips/:id`);
      console.log(`  GET    /api/trips/:id/seats`);
      console.log(`  GET    /api/payments/bank-info`);
      console.log(`  POST   /api/payments/bank-transfer`);
      console.log(`  GET    /api/payments/:paymentId`);
      console.log(`  GET    /api/payments/admin/pending`);
      console.log(`  GET    /api/payments/admin/all`);
      console.log(`  POST   /api/payments/admin/:paymentId/verify`);
      console.log(`  POST   /api/payments/admin/:paymentId/reject`);
      console.log(`  GET    /api/carrier/me`);
      console.log(`  GET    /api/carrier/trips`);
      console.log(`  POST   /api/carrier/trips`);
      console.log(`  GET    /api/carrier/bookings`);
      console.log(`  GET    /api/admin/trips`);
      console.log(`  POST   /api/admin/trips`);
      console.log(`  PUT    /api/admin/trips/:id`);
      console.log(`  DELETE /api/admin/trips/:id`);
      console.log(`  GET    /api/wallet`);
      console.log(`  GET    /api/health`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
