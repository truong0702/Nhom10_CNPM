import test from 'node:test';
import assert from 'node:assert';

// Business logic functions representing booking flow controllers (booking.js, payment.js, trip.js)
function validatePassengerInfo(info) {
  if (!info.fullName || !info.fullName.trim()) {
    throw new Error('Họ tên không được để trống');
  }
  if (!info.phone || !/^[0-9]{9,11}$/.test(info.phone.trim())) {
    throw new Error('Số điện thoại không hợp lệ');
  }
  if (!info.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim())) {
    throw new Error('Email không hợp lệ');
  }
  return {
    fullName: info.fullName.trim(),
    phone: info.phone.trim(),
    email: info.email.trim(),
  };
}

function calculateBookingPrice(tripPrice, selectedSeatsCount) {
  if (selectedSeatsCount <= 0) throw new Error('Vui lòng chọn ít nhất 1 ghế');
  return tripPrice * selectedSeatsCount;
}

function verifyPaymentStatus(payment, action) {
  if (!payment) throw new Error('Giao dịch không tồn tại');
  if (payment.status !== 'pending') {
    throw new Error('Giao dịch đã được xử lý trước đó');
  }
  if (action === 'verify') {
    payment.status = 'verified';
  } else if (action === 'reject') {
    payment.status = 'rejected';
  }
  return payment;
}

function processBookingCancellation(booking, cancelDeadlineHours = 24) {
  const now = new Date();
  const tripTime = new Date(booking.departureTime);
  const diffMs = tripTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < cancelDeadlineHours) {
    // 50% cancellation fee or not allowed
    booking.refundAmount = booking.totalPrice * 0.5;
    booking.status = 'cancelled';
  } else {
    // Full refund minus 10% fee
    booking.refundAmount = booking.totalPrice * 0.9;
    booking.status = 'cancelled';
  }
  return booking;
}

function processBookingExchange(booking, newTrip, exchangeFeePercent = 0.05) {
  if (newTrip.availableSeats < booking.seatsCount) {
    throw new Error('Chuyến mới không đủ ghế trống');
  }
  
  const exchangeFee = booking.totalPrice * exchangeFeePercent;
  booking.tripId = newTrip.id;
  booking.exchangeFee = exchangeFee;
  booking.status = 'exchanged';
  return booking;
}

test('UC31 - Đặt vé: passenger information validation', () => {
  // Valid
  const valid = validatePassengerInfo({
    fullName: ' Nguyen Van A ',
    phone: ' 0901234567 ',
    email: ' test@example.com ',
  });
  assert.strictEqual(valid.fullName, 'Nguyen Van A');
  assert.strictEqual(valid.phone, '0901234567');
  
  // Empty name
  assert.throws(() => {
    validatePassengerInfo({ phone: '0901234567', email: 'test@example.com' });
  }, /Họ tên không được để trống/);

  // Invalid phone
  assert.throws(() => {
    validatePassengerInfo({ fullName: 'A', phone: '123', email: 'test@example.com' });
  }, /Số điện thoại không hợp lệ/);

  // Invalid email
  assert.throws(() => {
    validatePassengerInfo({ fullName: 'A', phone: '0901234567', email: 'invalid_email' });
  }, /Email không hợp lệ/);
});

test('UC27/UC30/UC32 - Đặt vé: price computation and empty seat selection', () => {
  const tripPrice = 250000;
  
  // 3 seats selected
  const price = calculateBookingPrice(tripPrice, 3);
  assert.strictEqual(price, 750000);
  
  // 0 seats error
  assert.throws(() => {
    calculateBookingPrice(tripPrice, 0);
  }, /Vui lòng chọn ít nhất 1 ghế/);
});

test('UC33/UC34 - Thanh toán: online payment status transitions', () => {
  const payment = { id: 1, amount: 500000, status: 'pending' };
  
  // Verify
  const verified = verifyPaymentStatus({ ...payment }, 'verify');
  assert.strictEqual(verified.status, 'verified');
  
  // Reject
  const rejected = verifyPaymentStatus({ ...payment }, 'reject');
  assert.strictEqual(rejected.status, 'rejected');

  // Already processed transaction throws
  assert.throws(() => {
    verifyPaymentStatus(verified, 'verify');
  }, /Giao dịch đã được xử lý trước đó/);
});

test('UC37 - Hủy vé: cancel refund calculation based on time threshold', () => {
  const booking = { id: 1, totalPrice: 300000, status: 'confirmed' };
  
  // Scenario A: Cancel 30 hours before departure (refund 90%)
  const futureDeparture = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
  const cancelSuccess = processBookingCancellation({ ...booking, departureTime: futureDeparture });
  assert.strictEqual(cancelSuccess.status, 'cancelled');
  assert.strictEqual(cancelSuccess.refundAmount, 270000);
  
  // Scenario B: Cancel 5 hours before departure (refund 50%)
  const nearDeparture = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
  const cancelLate = processBookingCancellation({ ...booking, departureTime: nearDeparture });
  assert.strictEqual(cancelLate.status, 'cancelled');
  assert.strictEqual(cancelLate.refundAmount, 150000);
});

test('UC38 - Đổi vé: exchange tickets validating seat counts and fees', () => {
  const booking = { id: 1, totalPrice: 400000, seatsCount: 2, status: 'confirmed' };
  
  // New trip has enough seats
  const suitableTrip = { id: 'trip-99', availableSeats: 5 };
  const exchanged = processBookingExchange({ ...booking }, suitableTrip);
  assert.strictEqual(exchanged.status, 'exchanged');
  assert.strictEqual(exchanged.tripId, 'trip-99');
  assert.strictEqual(exchanged.exchangeFee, 20000); // 5% of 400k
  
  // New trip lacks seats
  const fullTrip = { id: 'trip-100', availableSeats: 1 };
  assert.throws(() => {
    processBookingExchange(booking, fullTrip);
  }, /Chuyến mới không đủ ghế trống/);
});
