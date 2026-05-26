import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Wallet = sequelize.define(
  'Wallet',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    balance: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    history: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: 'wallets',
  }
);

export default Wallet;
