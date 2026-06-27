import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RevenueRecord = sequelize.define(
  'RevenueRecord',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    source: {
      type: DataTypes.ENUM('subscription', 'online_split', 'cod'),
      allowNull: false,
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    grossAmount: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    platformFee: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    carrierAmount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    netRevenue: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('recorded', 'reconciled', 'disputed'),
      defaultValue: 'recorded',
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    tableName: 'revenue_records',
  }
);

export default RevenueRecord;
