import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Subscription = sequelize.define(
  'Subscription',
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
    planCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired'),
      defaultValue: 'active',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    tableName: 'subscriptions',
  }
);

export default Subscription;
