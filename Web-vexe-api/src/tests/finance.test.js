import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCodRevenueRecord,
  buildReconciliation,
  buildRevenueReport,
  calculateFee,
  splitOnlinePayment,
} from '../services/financeCore.js';

test('UC40 calculates service fee with percent, fixed fee, discount, and tax', () => {
  const fee = calculateFee({
    amount: 1000000,
    percent: 5,
    fixedFee: 10000,
    discount: 5000,
    taxPercent: 10,
  });

  assert.equal(fee.amount, 1000000);
  assert.equal(fee.serviceFee, 55000);
  assert.equal(fee.tax, 5500);
  assert.equal(fee.totalFee, 60500);
  assert.equal(fee.payableAmount, 1060500);
});

test('UC41 splits an online payment between platform and carrier', () => {
  const split = splitOnlinePayment({
    paymentId: 'pay-1',
    amount: 500000,
    platformPercent: 12,
  });

  assert.equal(split.paymentId, 'pay-1');
  assert.equal(split.grossAmount, 500000);
  assert.equal(split.platformFee, 60000);
  assert.equal(split.carrierAmount, 440000);
  assert.equal(split.remainder, 0);
});

test('UC42 builds a COD revenue record', () => {
  const record = buildCodRevenueRecord({
    bookingId: 'booking-1',
    carrierId: 'carrier-1',
    amount: 350000,
    collectedBy: 'station-a',
    collectedAt: '2026-06-20T00:00:00.000Z',
  });

  assert.equal(record.source, 'cod');
  assert.equal(record.referenceId, 'booking-1');
  assert.equal(record.grossAmount, 350000);
  assert.equal(record.carrierAmount, 350000);
  assert.equal(record.metadata.collectedBy, 'station-a');
});

test('UC43 reconciles verified payments and revenue records', () => {
  const result = buildReconciliation({
    payments: [
      { id: 'pay-1', amount: 100000 },
      { id: 'pay-2', amount: 200000 },
    ],
    revenueRecords: [
      { referenceId: 'pay-1', grossAmount: 100000 },
      { referenceId: 'pay-3', grossAmount: 50000 },
    ],
  });

  assert.equal(result.paymentTotal, 300000);
  assert.equal(result.recordedTotal, 150000);
  assert.equal(result.difference, 150000);
  assert.equal(result.matched, false);
  assert.deepEqual(result.missingRevenueRecords, ['pay-2']);
  assert.deepEqual(result.orphanRevenueRecords, ['pay-3']);
});

test('UC44 builds a revenue report grouped by source', () => {
  const report = buildRevenueReport({
    from: '2026-06-01T00:00:00.000Z',
    to: '2026-06-30T23:59:59.999Z',
    records: [
      {
        source: 'online_split',
        grossAmount: 1000000,
        platformFee: 100000,
        carrierAmount: 900000,
        netRevenue: 100000,
        recordedAt: '2026-06-10T00:00:00.000Z',
      },
      {
        source: 'cod',
        grossAmount: 500000,
        platformFee: 0,
        carrierAmount: 500000,
        netRevenue: 0,
        recordedAt: '2026-06-15T00:00:00.000Z',
      },
      {
        source: 'cod',
        grossAmount: 250000,
        recordedAt: '2026-07-01T00:00:00.000Z',
      },
    ],
  });

  assert.equal(report.count, 2);
  assert.equal(report.grossAmount, 1500000);
  assert.equal(report.netRevenue, 100000);
  assert.deepEqual(report.bySource, { online_split: 1000000, cod: 500000 });
});
