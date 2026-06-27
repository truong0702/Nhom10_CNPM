import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Feedback = sequelize.define(
  'Feedback',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('feedback', 'complaint'),
      defaultValue: 'feedback',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved'),
      defaultValue: 'pending',
    },
    adminReply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'feedbacks',
  }
);

export default Feedback;
