import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Trip from './Trip.js';

const Booking = sequelize.define(
  'Booking',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    tripId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Trip,
        key: 'id',
      },
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    total: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: 'Platform commission rate applied after payment is paid',
    },
    commissionAmount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Platform commission amount in VND',
    },
    carrierRevenue: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Net amount paid to carrier after commission',
    },
    paymentMethod: {
      type: DataTypes.ENUM('bank_transfer', 'wallet', 'cash_at_station', 'vnpay'),
      defaultValue: 'bank_transfer',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending',
    },
    cancelStatus: {
      type: DataTypes.ENUM('active', 'canceled'),
      defaultValue: 'active',
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exchanges: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    history: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'bookings',
  }
);

export default Booking;
