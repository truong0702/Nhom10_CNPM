import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Carrier from './Carrier.js';

const Trip = sequelize.define(
  'Trip',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    carrierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Carrier,
        key: 'id',
      },
    },
    from: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    departure: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrival: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrivalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    bus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicleType: {
      type: DataTypes.ENUM('sleeping', 'seating'),
      allowNull: false,
      defaultValue: 'seating',
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
    },
    seatsAvailable: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
    },
    price: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 4.5,
    },
    reviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'trips',
  }
);

export default Trip;
