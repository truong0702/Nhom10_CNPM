import { Op } from 'sequelize';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import RevenueRecord from '../models/RevenueRecord.js';

const roundVnd = (value) => Math.round(Number(value));

export const calculateFee = ({
  amount,
  percent = 0,
  fixedFee = 0,
  discount = 0,
  taxPercent = 0,
  minFee = 0,
  maxFee = null,
} = {}) => {
  const grossAmount = Number(amount);
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) throw new Error('amount must be greater than 0');

  let serviceFee = grossAmount * (Number(percent) / 100) + Number(fixedFee);
  serviceFee = Math.max(serviceFee - Number(discount), Number(minFee));
  if (maxFee !== null && maxFee !== undefined && maxFee !== '') serviceFee = Math.min(serviceFee, Number(maxFee));

  const tax = serviceFee * (Number(taxPercent) / 100);
  const totalFee = roundVnd(serviceFee + tax);

  return {
    amount: roundVnd(grossAmount),
    serviceFee: roundVnd(serviceFee),
    tax: roundVnd(tax),
    totalFee,
    payableAmount: roundVnd(grossAmount + totalFee),
  };
};

export const splitOnlinePayment = ({
  paymentId,
  amount,
  platformPercent = 10,
  carrierPercent = null,
  fixedPlatformFee = 0,
  carrierId = null,
} = {}) => {
  const grossAmount = Number(amount);
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) throw new Error('amount must be greater than 0');

  const platformFee = roundVnd(grossAmount * (Number(platformPercent) / 100) + Number(fixedPlatformFee));
  const carrierAmount =
    carrierPercent === null || carrierPercent === undefined || carrierPercent === ''
      ? roundVnd(grossAmount - platformFee)
      : roundVnd(grossAmount * (Number(carrierPercent) / 100));

  if (platformFee < 0 || carrierAmount < 0) throw new Error('split amounts cannot be negative');
  if (platformFee + carrierAmount > grossAmount) throw new Error('split amounts exceed gross amount');

  return {
    paymentId: paymentId || null,
    carrierId,
    grossAmount: roundVnd(grossAmount),
    platformFee,
    carrierAmount,
    remainder: roundVnd(grossAmount - platformFee - carrierAmount),
  };
};

export const buildCodRevenueRecord = ({
  bookingId,
  carrierId = null,
  amount,
  collectedBy,
  collectedAt = new Date(),
  note = '',
} = {}) => {
  const grossAmount = Number(amount);
  if (!bookingId) throw new Error('bookingId is required');
  if (!collectedBy) throw new Error('collectedBy is required');
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) throw new Error('amount must be greater than 0');

  return {
    source: 'cod',
    referenceId: bookingId,
    grossAmount: roundVnd(grossAmount),
    platformFee: 0,
    carrierAmount: roundVnd(grossAmount),
    netRevenue: 0,
    paymentMethod: 'cod',
    status: 'recorded',
    recordedAt: new Date(collectedAt),
    metadata: {
      carrierId,
      collectedBy,
      note,
    },
  };
};

export const buildReconciliation = ({ payments = [], revenueRecords = [] } = {}) => {
  const paymentTotal = payments.reduce((sum, item) => sum + Number(item.amount || item.grossAmount || 0), 0);
  const recordedTotal = revenueRecords.reduce((sum, item) => sum + Number(item.grossAmount || 0), 0);
  const paymentIds = new Set(payments.map((item) => item.id || item.paymentId || item.referenceId).filter(Boolean));
  const recordRefs = new Set(revenueRecords.map((item) => item.referenceId).filter(Boolean));

  return {
    paymentTotal: roundVnd(paymentTotal),
    recordedTotal: roundVnd(recordedTotal),
    difference: roundVnd(paymentTotal - recordedTotal),
    matched: roundVnd(paymentTotal) === roundVnd(recordedTotal),
    missingRevenueRecords: [...paymentIds].filter((id) => !recordRefs.has(id)),
    orphanRevenueRecords: [...recordRefs].filter((id) => !paymentIds.has(id)),
  };
};

export const buildRevenueReport = ({ records = [], from = null, to = null } = {}) => {
  const filtered = records.filter((record) => {
    const recordedAt = new Date(record.recordedAt || record.createdAt || Date.now());
    if (from && recordedAt < new Date(from)) return false;
    if (to && recordedAt > new Date(to)) return false;
    return true;
  });

  const summary = filtered.reduce(
    (acc, record) => {
      acc.grossAmount += Number(record.grossAmount || 0);
      acc.platformFee += Number(record.platformFee || 0);
      acc.carrierAmount += Number(record.carrierAmount || 0);
      acc.netRevenue += Number(record.netRevenue || 0);
      acc.count += 1;
      acc.bySource[record.source] = (acc.bySource[record.source] || 0) + Number(record.grossAmount || 0);
      return acc;
    },
    { grossAmount: 0, platformFee: 0, carrierAmount: 0, netRevenue: 0, count: 0, bySource: {} }
  );

  return {
    from,
    to,
    count: summary.count,
    grossAmount: roundVnd(summary.grossAmount),
    platformFee: roundVnd(summary.platformFee),
    carrierAmount: roundVnd(summary.carrierAmount),
    netRevenue: roundVnd(summary.netRevenue),
    bySource: summary.bySource,
  };
};

export const recordOnlineSplit = async (payload) => {
  const split = splitOnlinePayment(payload);
  return RevenueRecord.create({
    source: 'online_split',
    referenceId: split.paymentId,
    grossAmount: split.grossAmount,
    platformFee: split.platformFee,
    carrierAmount: split.carrierAmount,
    netRevenue: split.platformFee,
    paymentMethod: 'online',
    status: 'recorded',
    metadata: split,
  });
};

export const recordCodRevenue = async (payload) => {
  const record = buildCodRevenueRecord(payload);
  const created = await RevenueRecord.create(record);
  await Booking.update({ paymentStatus: 'paid', paymentMethod: 'cash_at_station' }, { where: { id: payload.bookingId } });
  return created;
};

export const getReconciliation = async ({ from, to } = {}) => {
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  const payments = await Payment.findAll({ where: { ...where, status: 'verified' } });
  const revenueRecords = await RevenueRecord.findAll({ where });
  return buildReconciliation({ payments, revenueRecords });
};

export const getRevenueReport = async ({ from, to } = {}) => {
  const where = {};
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt[Op.gte] = new Date(from);
    if (to) where.recordedAt[Op.lte] = new Date(to);
  }
  const records = await RevenueRecord.findAll({ where, order: [['recordedAt', 'DESC']] });
  return buildRevenueReport({ records, from, to });
};
