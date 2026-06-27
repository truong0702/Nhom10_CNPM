import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChatMessage = sequelize.define(
  'ChatMessage',
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
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderRole: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: 'chat_messages',
  }
);

export default ChatMessage;
