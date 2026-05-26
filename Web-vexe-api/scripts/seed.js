import Trip from '../src/models/Trip.js';
import Carrier from '../src/models/Carrier.js';
import sequelize from '../src/config/database.js';

async function seedDatabase() {
  try {
    // Ensure tables exist
    await sequelize.sync();

    // Create a carrier first
    let carrier = await Carrier.findOne({ where: { name: 'SleepBus Express' } });
    
    if (!carrier) {
      carrier = await Carrier.create({
        name: 'SleepBus Express',
        email: 'contact@sleepbus.com',
        phone: '1900-1000',
        rating: 4.5,
        reviews: 250
      });
      console.log('Created carrier:', carrier.id);
    }

    // Sample trips data - using correct field names
    const trips = [
      {
        carrierId: carrier.id,
        from: 'Ha Noi',
        to: 'TP.HCM',
        departure: '22:00',
        arrival: '06:00',
        date: '2026-06-01',
        bus: 'SleepBus Express',
        seats: 15,
        price: 450000,
        rating: 4.5,
        reviews: 125,
        image: 'default-bus.jpg'
      },
      {
        carrierId: carrier.id,
        from: 'Ha Noi',
        to: 'Da Nang',
        departure: '08:00',
        arrival: '16:00',
        date: '2026-06-01',
        bus: 'SleepBus Express',
        seats: 18,
        price: 350000,
        rating: 4.5,
        reviews: 98,
        image: 'default-bus.jpg'
      },
      {
        carrierId: carrier.id,
        from: 'TP.HCM',
        to: 'Can Tho',
        departure: '09:00',
        arrival: '12:00',
        date: '2026-06-01',
        bus: 'SleepBus Express',
        seats: 20,
        price: 150000,
        rating: 4.5,
        reviews: 156,
        image: 'default-bus.jpg'
      },
      {
        carrierId: carrier.id,
        from: 'Da Nang',
        to: 'TP.HCM',
        departure: '18:00',
        arrival: '06:00',
        date: '2026-06-02',
        bus: 'SleepBus Express',
        seats: 16,
        price: 400000,
        rating: 4.5,
        reviews: 87,
        image: 'default-bus.jpg'
      },
      {
        carrierId: carrier.id,
        from: 'Ha Noi',
        to: 'Hue',
        departure: '14:00',
        arrival: '22:00',
        date: '2026-06-02',
        bus: 'SleepBus Express',
        seats: 17,
        price: 300000,
        rating: 4.5,
        reviews: 142,
        image: 'default-bus.jpg'
      }
    ];

    // Delete existing trips to avoid duplicates
    await Trip.destroy({ where: {} });

    // Create trips
    await Trip.bulkCreate(trips);

    console.log('Created 5 sample trips successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run seed function
seedDatabase();
