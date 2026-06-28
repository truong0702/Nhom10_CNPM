import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Booking from './Booking.js';

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Booking,
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM('bank_transfer', 'wallet', 'cash_at_station', 'vnpay'),
      defaultValue: 'bank_transfer',
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Amount in VND',
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'failed'),
      defaultValue: 'pending',
    },
    // Bank transfer specific fields
    transactionRef: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Bank transaction reference number',
    },
    bankTransferDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bankTransferTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankSenderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankSenderAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankTransferNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Transfer note/message from user',
    },
    // Receiver account info (người nhận tiền)
    receiverAccountName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên người nhận tiền',
    },
    receiverAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Số tài khoản nhận tiền',
    },
    receiverBankName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên ngân hàng nhận tiền',
    },
    // Verification
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    tableName: 'payments',
  }
);

export default Payment;
