import test from 'node:test';
import assert from 'node:assert';

// Mock function representing logic in controllers/admin.js for Carrier management
function approveCarrier(carrier) {
  if (!carrier) throw new Error('Carrier not found');
  carrier.approved = true;
  return carrier;
}

function updateCarrier(carrier, updates) {
  if (!carrier) throw new Error('Carrier not found');
  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error('Name cannot be empty');
    carrier.name = updates.name.trim();
  }
  if (updates.email !== undefined) {
    carrier.email = updates.email;
  }
  if (updates.phone !== undefined) {
    carrier.phone = updates.phone;
  }
  if (updates.address !== undefined) {
    carrier.address = updates.address;
  }
  return carrier;
}

function toggleCarrierStatus(carrier, status) {
  if (!carrier) throw new Error('Carrier not found');
  if (status && !['active', 'inactive'].includes(status)) {
    throw new Error('Invalid status');
  }
  carrier.status = status || (carrier.status === 'active' ? 'inactive' : 'active');
  return carrier;
}

function filterCarriersList(carriers, filters) {
  return carriers.filter(c => {
    if (filters.approved !== undefined && c.approved !== filters.approved) return false;
    if (filters.status !== undefined && c.status !== filters.status) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const nameMatch = c.name && c.name.toLowerCase().includes(s);
      const emailMatch = c.email && c.email.toLowerCase().includes(s);
      return nameMatch || emailMatch;
    }
    return true;
  });
}

test('UC05 - Admin: approve carrier successfully', () => {
  const carrier = { id: 1, name: 'Garage A', approved: false, status: 'active' };
  const result = approveCarrier(carrier);
  assert.strictEqual(result.approved, true);
});

test('UC06 - Admin: update carrier details with validation', () => {
  const carrier = { id: 1, name: 'Garage A', email: 'a@example.com', phone: '0123' };
  
  // Valid update
  const updated = updateCarrier(carrier, { name: 'Garage B', phone: '9999' });
  assert.strictEqual(updated.name, 'Garage B');
  assert.strictEqual(updated.phone, '9999');
  assert.strictEqual(updated.email, 'a@example.com');
  
  // Invalid update
  assert.throws(() => {
    updateCarrier(carrier, { name: '   ' });
  }, /Name cannot be empty/);
});

test('UC07 - Admin: toggle carrier status correctly', () => {
  const carrier = { id: 1, name: 'Garage A', status: 'active' };
  
  // Auto toggle
  let result = toggleCarrierStatus(carrier);
  assert.strictEqual(result.status, 'inactive');
  
  // Specific toggle
  result = toggleCarrierStatus(carrier, 'active');
  assert.strictEqual(result.status, 'active');
  
  assert.throws(() => {
    toggleCarrierStatus(carrier, 'invalid_status');
  }, /Invalid status/);
});

test('UC08 - Admin: retrieve and filter carrier list', () => {
  const carriers = [
    { id: 1, name: 'Garage Alpha', approved: true, status: 'active' },
    { id: 2, name: 'Garage Beta', approved: false, status: 'active' },
    { id: 3, name: 'Car Garage Delta', approved: true, status: 'inactive' },
  ];
  
  // Test approval filter
  const approvedOnly = filterCarriersList(carriers, { approved: true });
  assert.strictEqual(approvedOnly.length, 2);
  assert.strictEqual(approvedOnly[0].name, 'Garage Alpha');
  
  // Test search filter
  const searchResult = filterCarriersList(carriers, { search: 'delta' });
  assert.strictEqual(searchResult.length, 1);
  assert.strictEqual(searchResult[0].name, 'Car Garage Delta');
});
