import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCancellation,
  buildRenewal,
  buildSubscriptionRegistration,
  summarizePaymentHistory,
} from '../services/subscriptionCore.js';

test('UC36 registers a subscription with payment history', () => {
  const now = new Date('2026-06-20T00:00:00.000Z');
  const subscription = buildSubscriptionRegistration(
    {
      userId: 'user-1',
      planCode: 'basic',
      paymentMethod: 'wallet',
    },
    now
  );

  assert.equal(subscription.userId, 'user-1');
  assert.equal(subscription.planName, 'Basic');
  assert.equal(subscription.status, 'active');
  assert.equal(subscription.paymentHistory.length, 1);
  assert.equal(subscription.paymentHistory[0].action, 'register');
  assert.equal(subscription.paymentHistory[0].amount, 99000);
});

test('UC37 renews from current end date when subscription is still active', () => {
  const now = new Date('2026-06-20T00:00:00.000Z');
  const renewal = buildRenewal(
    {
      id: 'sub-1',
      planCode: 'basic',
      planName: 'Basic',
      price: 99000,
      durationMonths: 1,
      status: 'active',
      endDate: new Date('2026-07-20T00:00:00.000Z'),
      paymentHistory: [{ action: 'register', amount: 99000, paidAt: now.toISOString() }],
    },
    {},
    now
  );

  assert.equal(renewal.status, 'active');
  assert.equal(renewal.paymentHistory.length, 2);
  assert.equal(renewal.paymentHistory[1].action, 'renew');
  assert.equal(renewal.endDate.toISOString(), '2026-08-20T00:00:00.000Z');
});

test('UC38 cancels an active subscription', () => {
  const now = new Date('2026-06-20T00:00:00.000Z');
  const cancellation = buildCancellation(
    { id: 'sub-1', status: 'active' },
    { reason: 'No longer needed' },
    now
  );

  assert.equal(cancellation.status, 'cancelled');
  assert.equal(cancellation.cancelReason, 'No longer needed');
  assert.equal(cancellation.cancelledAt, now);
});

test('UC39 flattens subscription payment history', () => {
  const history = summarizePaymentHistory([
    {
      id: 'sub-1',
      planCode: 'pro',
      planName: 'Pro',
      status: 'active',
      paymentHistory: [
        { action: 'register', amount: 249000, paidAt: '2026-06-20T00:00:00.000Z' },
        { action: 'renew', amount: 249000, paidAt: '2026-09-20T00:00:00.000Z' },
      ],
    },
  ]);

  assert.equal(history.length, 2);
  assert.deepEqual(
    history.map((item) => item.sequence),
    [1, 2]
  );
  assert.equal(history[1].subscriptionId, 'sub-1');
});
