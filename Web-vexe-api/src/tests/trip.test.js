import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeTripPayload, validateTripPayload } from '../controllers/carrier.js';

test('UC17/UC22 - normalize trip creation payload', () => {
  const payload = {
    from: ' Hà Nội ',
    to: ' Hải Phòng ',
    departure: '08:00',
    arrival: '10:00',
    duration: '2h 00m',
    date: '2026-06-27',
    bus: 'Thành Công Limousine',
    seats: 9,
    price: 150000,
  };

  const normalized = normalizeTripPayload(payload, 'carrier-1');

  assert.equal(normalized.carrierId, 'carrier-1');
  assert.equal(normalized.from, 'Hà Nội');
  assert.equal(normalized.to, 'Hải Phòng');
  assert.equal(normalized.seats, 9);
  assert.equal(normalized.seatsAvailable, 9); // Initially seatsAvailable = total seats
  assert.equal(normalized.status, 'active');
  assert.equal(normalized.rating, 4.5); // Default rating
});

test('UC18/UC23 - normalize trip update payload preserving existing values', () => {
  const existingTrip = {
    id: 'trip-1',
    carrierId: 'carrier-1',
    from: 'Hà Nội',
    to: 'Hải Phòng',
    seats: 9,
    seatsAvailable: 4,
    price: 150000,
    rating: 4.8,
    reviews: 12,
    status: 'active',
  };

  const payload = {
    price: 160000,
    seatsAvailable: 3,
  };

  const normalized = normalizeTripPayload(payload, 'carrier-1', existingTrip);

  assert.equal(normalized.price, 160000);
  assert.equal(normalized.seatsAvailable, 3);
  assert.equal(normalized.seats, 9); // Unchanged
  assert.equal(normalized.rating, 4.8); // Retained
  assert.equal(normalized.reviews, 12); // Retained
});

test('UC20 - normalize trip departure time update', () => {
  const existingTrip = {
    id: 'trip-1',
    departure: '08:00',
    arrival: '10:00',
  };

  const payload = {
    departure: '09:00',
    arrival: '11:00',
  };

  const normalized = normalizeTripPayload(payload, 'carrier-1', existingTrip);

  assert.equal(normalized.departure, '09:00');
  assert.equal(normalized.arrival, '11:00');
});

test('UC21 - normalize route setup points', () => {
  const payload = {
    from: '  Đà Nẵng  ',
    to: '  Huế  ',
  };

  const normalized = normalizeTripPayload(payload, 'carrier-1');

  assert.equal(normalized.from, 'Đà Nẵng');
  assert.equal(normalized.to, 'Huế');
});

test('UC25 - normalize status update options', () => {
  const existingTrip = {
    status: 'active',
  };

  // Test inactive
  const normalized1 = normalizeTripPayload({ status: 'inactive' }, 'carrier-1', existingTrip);
  assert.equal(normalized1.status, 'inactive');

  // Test invalid status falls back to existing
  const normalized2 = normalizeTripPayload({ status: 'unknown' }, 'carrier-1', existingTrip);
  assert.equal(normalized2.status, 'active');
});

test('UC26 - cancel status mapping', () => {
  const normalized = normalizeTripPayload({ status: 'cancelled' }, 'carrier-1');
  assert.equal(normalized.status, 'cancelled');
});

test('UC19 - validate trip payload constraints', () => {
  // Test required fields
  const missingFieldPayload = {
    carrierId: 'carrier-1',
    from: 'Hà Nội',
    // 'to' is missing
    departure: '08:00',
    arrival: '10:00',
    date: '2026-06-27',
    bus: 'Limousine',
    seats: 9,
    price: 150000,
  };
  assert.equal(validateTripPayload(missingFieldPayload), 'to is required');

  // Test invalid seats
  const invalidSeatsPayload = {
    carrierId: 'carrier-1',
    from: 'Hà Nội',
    to: 'Hải Phòng',
    departure: '08:00',
    arrival: '10:00',
    date: '2026-06-27',
    arrivalDate: '2026-06-27',
    bus: 'Limousine',
    vehicleType: 'seating',
    seats: 0,
    price: 150000,
  };
  assert.equal(validateTripPayload(invalidSeatsPayload), 'seats must be greater than 0');

  // Test seatsAvailable exceeding seats
  const invalidSeatsAvailPayload = {
    carrierId: 'carrier-1',
    from: 'Hà Nội',
    to: 'Hải Phòng',
    departure: '08:00',
    arrival: '10:00',
    date: '2026-06-27',
    arrivalDate: '2026-06-27',
    bus: 'Limousine',
    vehicleType: 'seating',
    seats: 9,
    seatsAvailable: 10,
    price: 150000,
  };
  assert.equal(validateTripPayload(invalidSeatsAvailPayload), 'seatsAvailable cannot exceed seats');

  // Test invalid price
  const invalidPricePayload = {
    carrierId: 'carrier-1',
    from: 'Hà Nội',
    to: 'Hải Phòng',
    departure: '08:00',
    arrival: '10:00',
    date: '2026-06-27',
    arrivalDate: '2026-06-27',
    bus: 'Limousine',
    vehicleType: 'seating',
    seats: 9,
    seatsAvailable: 9,
    price: -1000,
  };
  assert.equal(validateTripPayload(invalidPricePayload), 'price must be greater than 0');

  // Test valid payload
  const validPayload = {
    carrierId: 'carrier-1',
    from: 'Hà Nội',
    to: 'Hải Phòng',
    departure: '08:00',
    arrival: '10:00',
    date: '2026-06-27',
    arrivalDate: '2026-06-27',
    bus: 'Limousine',
    vehicleType: 'seating',
    seats: 9,
    seatsAvailable: 9,
    price: 150000,
  };
  assert.equal(validateTripPayload(validPayload), null);
});
