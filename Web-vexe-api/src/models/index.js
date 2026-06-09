import Booking from './Booking.js';
import Carrier from './Carrier.js';
import Trip from './Trip.js';
import User from './User.js';
import Wallet from './Wallet.js';
import Payment from './Payment.js';

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

export {
  Booking,
  Carrier,
  Trip,
  User,
  Wallet,
  Payment,
};
