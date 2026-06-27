import Subscription from '../models/Subscription.js';

export const PLAN_CATALOG = {
  basic: { planCode: 'basic', planName: 'Basic', price: 99000, durationMonths: 1 },
  pro: { planCode: 'pro', planName: 'Pro', price: 249000, durationMonths: 3 },
  enterprise: { planCode: 'enterprise', planName: 'Enterprise', price: 799000, durationMonths: 12 },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + Number(months));
  return next;
};

export const createPaymentEntry = ({ amount, action, paidAt = new Date(), method = 'bank_transfer' }) => ({
  action,
  amount: Number(amount),
  method,
  paidAt: paidAt.toISOString(),
});

export const resolvePlan = (payload = {}) => {
  const catalogPlan = payload.planCode ? PLAN_CATALOG[payload.planCode] : null;
  const plan = {
    planCode: payload.planCode || catalogPlan?.planCode,
    planName: payload.planName || catalogPlan?.planName,
    price: payload.price !== undefined ? Number(payload.price) : catalogPlan?.price,
    durationMonths:
      payload.durationMonths !== undefined ? Number(payload.durationMonths) : catalogPlan?.durationMonths,
  };

  if (!plan.planCode || !plan.planName) throw new Error('planCode and planName are required');
  if (!Number.isFinite(plan.price) || plan.price <= 0) throw new Error('price must be greater than 0');
  if (!Number.isInteger(plan.durationMonths) || plan.durationMonths <= 0) {
    throw new Error('durationMonths must be a positive integer');
  }

  return plan;
};

export const buildSubscriptionRegistration = (payload = {}, now = new Date()) => {
  const userId = payload.userId;
  if (!userId) throw new Error('userId is required');

  const plan = resolvePlan(payload);
  const startDate = payload.startDate ? new Date(payload.startDate) : new Date(now);
  const endDate = addMonths(startDate, plan.durationMonths);

  return {
    userId,
    ...plan,
    status: 'active',
    startDate,
    endDate,
    paymentHistory: [
      createPaymentEntry({
        amount: plan.price,
        action: 'register',
        paidAt: now,
        method: payload.paymentMethod || 'bank_transfer',
      }),
    ],
    metadata: payload.metadata || {},
  };
};

export const buildRenewal = (subscription, payload = {}, now = new Date()) => {
  if (!subscription) throw new Error('Subscription not found');
  if (subscription.status === 'cancelled') throw new Error('Cancelled subscription cannot be renewed');

  const plan = resolvePlan({
    planCode: payload.planCode || subscription.planCode,
    planName: payload.planName || subscription.planName,
    price: payload.price !== undefined ? payload.price : subscription.price,
    durationMonths: payload.durationMonths || subscription.durationMonths,
  });

  const currentEnd = new Date(subscription.endDate);
  const baseDate = currentEnd > now ? currentEnd : now;
  const nextEndDate = addMonths(baseDate, plan.durationMonths);
  const paymentHistory = [
    ...(subscription.paymentHistory || []),
    createPaymentEntry({
      amount: plan.price,
      action: 'renew',
      paidAt: now,
      method: payload.paymentMethod || 'bank_transfer',
    }),
  ];

  return {
    ...plan,
    status: 'active',
    endDate: nextEndDate,
    paymentHistory,
  };
};

export const buildCancellation = (subscription, payload = {}, now = new Date()) => {
  if (!subscription) throw new Error('Subscription not found');
  if (subscription.status === 'cancelled') throw new Error('Subscription is already cancelled');

  return {
    status: 'cancelled',
    cancelledAt: now,
    cancelReason: payload.reason || 'User requested cancellation',
  };
};

export const summarizePaymentHistory = (subscriptions = []) => {
  return subscriptions.flatMap((subscription) =>
    (subscription.paymentHistory || []).map((entry, index) => ({
      subscriptionId: subscription.id,
      planCode: subscription.planCode,
      planName: subscription.planName,
      status: subscription.status,
      sequence: index + 1,
      ...entry,
    }))
  );
};

export const registerSubscription = async (payload) => {
  const subscriptionPayload = buildSubscriptionRegistration(payload);
  return Subscription.create(subscriptionPayload);
};

export const renewSubscription = async (id, payload) => {
  const subscription = await Subscription.findByPk(id);
  const renewal = buildRenewal(subscription, payload);
  await subscription.update(renewal);
  return subscription;
};

export const cancelSubscription = async (id, payload) => {
  const subscription = await Subscription.findByPk(id);
  const cancellation = buildCancellation(subscription, payload);
  await subscription.update(cancellation);
  return subscription;
};

export const getPaymentHistory = async (userId = null) => {
  const where = userId ? { userId } : undefined;
  const subscriptions = await Subscription.findAll({ where, order: [['createdAt', 'DESC']] });
  return summarizePaymentHistory(subscriptions);
};

export const getExpiringSoon = async (subscriptions = [], now = new Date(), days = 7) => {
  const threshold = new Date(now.getTime() + days * MS_PER_DAY);
  return subscriptions.filter((subscription) => {
    const endDate = new Date(subscription.endDate);
    return subscription.status === 'active' && endDate >= now && endDate <= threshold;
  });
};
