import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupportSurvey = sequelize.define(
  'SupportSurvey',
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
    feedbackId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'support_surveys',
  }
);

export default SupportSurvey;
