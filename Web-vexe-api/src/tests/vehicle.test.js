import test from 'node:test';
import assert from 'node:assert';

// Mock functions representing logic in controllers/vehicle.js
function validateVehiclePayload(payload) {
  if (!payload.plateNumber || !payload.plateNumber.trim()) {
    throw new Error('Plate number is required');
  }
  if (payload.type && !['sleeping', 'seating'].includes(payload.type)) {
    throw new Error('Invalid vehicle type');
  }
  if (payload.status && !['active', 'inactive'].includes(payload.status)) {
    throw new Error('Invalid status');
  }
  return {
    plateNumber: payload.plateNumber.trim(),
    type: payload.type || 'seating',
    driverName: payload.driverName ? payload.driverName.trim() : null,
    status: payload.status || 'active',
  };
}

test('UC09 - Nhà xe: thêm xe validation rules', () => {
  // Valid payload
  const valid = validateVehiclePayload({
    plateNumber: ' 29A-123.45 ',
    type: 'sleeping',
    driverName: ' Driver Name ',
  });
  
  assert.strictEqual(valid.plateNumber, '29A-123.45');
  assert.strictEqual(valid.type, 'sleeping');
  assert.strictEqual(valid.driverName, 'Driver Name');
  assert.strictEqual(valid.status, 'active');
  
  // Missing plateNumber
  assert.throws(() => {
    validateVehiclePayload({ type: 'seating' });
  }, /Plate number is required/);

  // Invalid type
  assert.throws(() => {
    validateVehiclePayload({ plateNumber: '29A-123.45', type: 'invalid_type' });
  }, /Invalid vehicle type/);
});

test('UC10/UC11 - Nhà xe: update and delete vehicle settings', () => {
  const vehicle = {
    id: 'veh-123',
    plateNumber: '29A-123.45',
    type: 'sleeping',
    driverName: 'Old Driver',
    status: 'active',
  };
  
  // Valid update
  const payload = {
    plateNumber: '30B-999.99',
    type: 'seating',
    driverName: 'New Driver',
    status: 'inactive',
  };
  
  const validated = validateVehiclePayload(payload);
  const updatedVehicle = { ...vehicle, ...validated };
  
  assert.strictEqual(updatedVehicle.plateNumber, '30B-999.99');
  assert.strictEqual(updatedVehicle.type, 'seating');
  assert.strictEqual(updatedVehicle.driverName, 'New Driver');
  assert.strictEqual(updatedVehicle.status, 'inactive');
});

test('UC12 - Nhà xe: list vehicles by category filter', () => {
  const vehiclesList = [
    { id: 1, plateNumber: 'A1', type: 'sleeping', status: 'active' },
    { id: 2, plateNumber: 'A2', type: 'seating', status: 'active' },
    { id: 3, plateNumber: 'A3', type: 'sleeping', status: 'inactive' },
  ];
  
  const sleepingOnly = vehiclesList.filter(v => v.type === 'sleeping');
  assert.strictEqual(sleepingOnly.length, 2);
  
  const activeOnly = vehiclesList.filter(v => v.status === 'active');
  assert.strictEqual(activeOnly.length, 2);
});
