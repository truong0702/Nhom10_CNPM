import Booking from './Booking.js';
import Carrier from './Carrier.js';
import Trip from './Trip.js';
import User from './User.js';
import Wallet from './Wallet.js';
import Payment from './Payment.js';
import Feedback from './Feedback.js';
import ChatMessage from './ChatMessage.js';
import SupportSurvey from './SupportSurvey.js';
import Subscription from './Subscription.js';
import RevenueRecord from './RevenueRecord.js';
import Vehicle from './Vehicle.js';

User.hasOne(Wallet, { foreignKey: 'userId' });
Wallet.belongsTo(User, { foreignKey: 'userId' });

Carrier.hasMany(Trip, { foreignKey: 'carrierId' });
Trip.belongsTo(Carrier, { foreignKey: 'carrierId' });
User.hasOne(Carrier, { foreignKey: 'ownerUserId', as: 'ownedCarrier' });
Carrier.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });

User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });
Trip.hasMany(Booking, { foreignKey: 'tripId' });
Booking.belongsTo(Trip, { foreignKey: 'tripId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });
Booking.hasMany(Payment, { foreignKey: 'bookingId' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId' });

User.hasMany(Feedback, { foreignKey: 'userId' });
Feedback.belongsTo(User, { foreignKey: 'userId' });
Booking.hasMany(Feedback, { foreignKey: 'bookingId' });
Feedback.belongsTo(Booking, { foreignKey: 'bookingId' });

User.hasMany(ChatMessage, { foreignKey: 'userId' });
ChatMessage.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SupportSurvey, { foreignKey: 'userId' });
SupportSurvey.belongsTo(User, { foreignKey: 'userId' });
Feedback.hasOne(SupportSurvey, { foreignKey: 'feedbackId' });
SupportSurvey.belongsTo(Feedback, { foreignKey: 'feedbackId' });

User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

Carrier.hasMany(Vehicle, { foreignKey: 'carrierId' });
Vehicle.belongsTo(Carrier, { foreignKey: 'carrierId' });

export {
  Booking,
  Carrier,
  Trip,
  User,
  Wallet,
  Payment,
  Feedback,
  ChatMessage,
  SupportSurvey,
  Subscription,
  RevenueRecord,
  Vehicle,
};
