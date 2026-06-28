import crypto from 'crypto';
import { Payment, Booking, User, Trip } from '../models/index.js';
import { sendBookingConfirmation } from '../utils/mailer.js';

const CARRIER_COMMISSION_RATE = 0.1;

const getTicketCode = (bookingId) => `VE-${String(bookingId || '').slice(0, 8).toUpperCase()}`;

const getSelectedSeatLabels = (items) => (Array.isArray(items) ? items : [])
  .flatMap((item) => item.selectedSeatLabels || item.selectedSeats || [])
  .map((label) => String(label));

const getSeatCount = (items) => {
  if (!Array.isArray(items)) return 1;
  return items.reduce((sum, item) => {
    const selectedSeats = item.selectedSeatLabels || item.selectedSeats || [];
    return sum + Number(item.seats || selectedSeats.length || item.qty || 1);
  }, 0);
};

const getPaymentMethodLabel = (paymentMethod) => {
  if (paymentMethod === 'vnpay') return 'VNPay';
  if (paymentMethod === 'wallet') return 'Vi VeXe';
  if (paymentMethod === 'cash_at_station') return 'Thanh toan tai quay';
  return 'Chuyen khoan ngan hang';
};

const sortObject = (obj) => Object.keys(obj)
  .sort()
  .reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});

const encodeValue = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');

const buildSignedQuery = (params, hashSecret) => {
  const sortedParams = sortObject(params);
  const signData = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${encodeValue(value)}`)
    .join('&');
  const secureHash = crypto
    .createHmac('sha512', hashSecret)
    .update(signData, 'utf-8')
    .digest('hex');

  return {
    query: `${signData}&vnp_SecureHash=${secureHash}`,
    secureHash,
  };
};

const verifyVnpaySignature = (query = {}) => {
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  if (!hashSecret) return false;

  const params = { ...query };
  const receivedHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const { secureHash } = buildSignedQuery(params, hashSecret);
  return secureHash.toLowerCase() === String(receivedHash || '').toLowerCase();
};

const formatVnpayDate = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
};

const sendVerifiedBookingEmail = async (booking) => {
  const [user, trip] = await Promise.all([
    User.findByPk(booking.userId, { attributes: ['email', 'fullName'] }),
    Trip.findByPk(booking.tripId),
  ]);

  if (!user?.email || !trip) return;

  await sendBookingConfirmation(user.email, {
    ticketCode: getTicketCode(booking.id),
    fullName: user.fullName,
    from: trip.from,
    to: trip.to,
    date: trip.date,
    departure: trip.departure,
    arrival: trip.arrival,
    bus: trip.bus,
    seats: getSelectedSeatLabels(booking.items),
    seatCount: getSeatCount(booking.items),
    total: booking.total,
    paymentMethod: getPaymentMethodLabel(booking.paymentMethod),
  });
};

const markBookingPaid = async (booking, event = 'PAYMENT_VERIFIED') => {
  booking.paymentStatus = 'paid';
  applyCarrierCommission(booking);
  if (!booking.history) booking.history = [];
  booking.history.push({
    event,
    rate: CARRIER_COMMISSION_RATE,
    commissionAmount: booking.commissionAmount,
    carrierRevenue: booking.carrierRevenue,
    timestamp: new Date(),
  });
  await booking.save();
};

const processVnpayResult = async (query = {}) => {
  const validSignature = verifyVnpaySignature(query);
  if (!validSignature) {
    return { ok: false, code: '97', message: 'Invalid signature' };
  }

  const txnRef = query.vnp_TxnRef;
  const responseCode = query.vnp_ResponseCode;
  const transactionNo = query.vnp_TransactionNo;
  const amount = Number(query.vnp_Amount || 0) / 100;

  const payment = await Payment.findOne({
    where: { transactionRef: txnRef },
  });

  if (!payment) {
    return { ok: false, code: '01', message: 'Payment not found' };
  }

  const booking = await Booking.findByPk(payment.bookingId);
  if (!booking) {
    return { ok: false, code: '01', message: 'Booking not found' };
  }

  if (Number(payment.amount) !== amount) {
    return { ok: false, code: '04', message: 'Amount mismatch' };
  }

  if (payment.status === 'verified') {
    return { ok: true, code: '00', message: 'Payment already verified', payment, booking };
  }

  if (responseCode === '00') {
    payment.status = 'verified';
    payment.verifiedAt = new Date();
    payment.transactionRef = txnRef;
    payment.verificationNote = `VNPay transaction ${transactionNo || ''}`.trim();
    payment.metadata = {
      ...(payment.metadata || {}),
      vnpay: query,
      vnpTransactionNo: transactionNo || null,
    };
    await payment.save();

    await markBookingPaid(booking, 'VNPAY_PAYMENT_VERIFIED');

    try {
      await sendVerifiedBookingEmail(booking);
    } catch (emailError) {
      console.error('Failed to send VNPay booking email:', emailError);
    }

    return { ok: true, code: '00', message: 'Payment verified', payment, booking };
  }

  payment.status = 'failed';
  payment.verifiedAt = new Date();
  payment.verificationNote = `VNPay failed with code ${responseCode}`;
  payment.metadata = {
    ...(payment.metadata || {}),
    vnpay: query,
  };
  await payment.save();

  booking.paymentStatus = 'failed';
  await booking.save();

  return { ok: false, code: responseCode || '99', message: 'Payment failed', payment, booking };
};

const applyCarrierCommission = (booking) => {
  const total = Number(booking.total || 0);
  const commissionAmount = Math.round(total * CARRIER_COMMISSION_RATE);
  booking.commissionRate = CARRIER_COMMISSION_RATE;
  booking.commissionAmount = commissionAmount;
  booking.carrierRevenue = Math.max(total - commissionAmount, 0);
};

// Get bank account information
export const getBankInfo = async (req, res) => {
  try {
    const bankInfo = {
      accountName: process.env.BANK_ACCOUNT_NAME || 'VEX TRANSPORT CO.',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890123',
      bankName: process.env.BANK_NAME || 'Vietcombank',
      bankBranch: process.env.BANK_BRANCH || 'Chi nhánh Hà Nội',
      bankCode: process.env.BANK_CODE || '970436',
    };

    return res.status(200).json({
      message: 'Bank account information',
      data: bankInfo,
    });
  } catch (error) {
    console.error('Get bank info error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create payment record for bank transfer
export const createBankTransferPayment = async (req, res) => {
  try {
    const {
      bookingId,
      amount,
      bankTransferNote,
    } = req.body;
    const userId = req.user.id;

    // Validate booking exists
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Validate user owns booking
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Convert to number for comparison
    const amountNum = Number(amount);
    const bookingTotalNum = Number(booking.total);

    console.log('[Payment] Creating bank transfer:', {
      bookingId,
      amountReceived: amount,
      amountNum,
      bookingTotalNum,
      match: amountNum === bookingTotalNum,
    });

    // Validate amount matches booking total
    if (amountNum !== bookingTotalNum) {
      return res.status(400).json({
        error: 'Amount mismatch',
        expected: bookingTotalNum,
        provided: amountNum,
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: { bookingId, status: 'pending' },
    });

    if (existingPayment) {
      return res.status(400).json({
        error: 'Payment already exists for this booking',
        paymentId: existingPayment.id,
      });
    }

    // Create payment record
    const payment = await Payment.create({
      bookingId,
      userId,
      paymentMethod: 'bank_transfer',
      amount,
      status: 'pending',
      bankTransferNote: bankTransferNote || '',
      // Lưu info người nhận tiền
      receiverAccountName: process.env.BANK_ACCOUNT_NAME,
      receiverAccountNumber: process.env.BANK_ACCOUNT_NUMBER,
      receiverBankName: process.env.BANK_NAME,
    });

    // Update booking payment method
    booking.paymentMethod = 'bank_transfer';
    await booking.save();

    return res.status(201).json({
      message: 'Bank transfer payment created. Please complete the transfer.',
      payment: {
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      instructions: {
        text: `Vui lòng chuyển khoản ${amount.toLocaleString('vi-VN')} VND đến tài khoản ngân hàng`,
        bankInfo: {
          accountName: process.env.BANK_ACCOUNT_NAME,
          accountNumber: process.env.BANK_ACCOUNT_NUMBER,
          bankName: process.env.BANK_NAME,
          bankBranch: process.env.BANK_BRANCH,
        },
        transferNote: `Booking ${bookingId} - ${booking.items?.[0]?.title || 'Bus Ticket'}`,
      },
    });
  } catch (error) {
    console.error('Create bank transfer payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create VNPay payment URL
export const createVnpayPayment = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const paymentUrl = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return';

    if (!tmnCode || !hashSecret || tmnCode.startsWith('your_') || hashSecret.startsWith('your_')) {
      return res.status(500).json({ error: 'VNPay is not configured' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const amountNum = Number(amount);
    const bookingTotalNum = Number(booking.total);
    if (!amountNum || amountNum !== bookingTotalNum) {
      return res.status(400).json({
        error: 'Amount mismatch',
        expected: bookingTotalNum,
        provided: amountNum,
      });
    }

    const existingPayment = await Payment.findOne({
      where: {
        bookingId,
        paymentMethod: 'vnpay',
        status: 'pending',
      },
    });

    const txnRef = existingPayment?.transactionRef || `VNP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const payment = existingPayment || await Payment.create({
      bookingId,
      userId,
      paymentMethod: 'vnpay',
      amount: amountNum,
      status: 'pending',
      transactionRef: txnRef,
      metadata: { provider: 'vnpay' },
    });

    booking.paymentMethod = 'vnpay';
    booking.paymentStatus = 'pending';
    await booking.save();

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: amountNum * 100,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: payment.transactionRef,
      vnp_OrderInfo: `Thanh toan ve ${getTicketCode(booking.id)}`,
      vnp_OrderType: 'billpayment',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getClientIp(req),
      vnp_CreateDate: formatVnpayDate(new Date()),
    };

    const { query } = buildSignedQuery(params, hashSecret);

    return res.status(201).json({
      message: 'VNPay payment URL created',
      payment: {
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        status: payment.status,
        transactionRef: payment.transactionRef,
      },
      paymentUrl: `${paymentUrl}?${query}`,
    });
  } catch (error) {
    console.error('Create VNPay payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// VNPay return URL verifier for frontend
export const handleVnpayReturn = async (req, res) => {
  try {
    const result = await processVnpayResult(req.query);
    return res.status(200).json({
      success: result.ok,
      code: result.code,
      message: result.message,
      bookingId: result.booking?.id,
      paymentId: result.payment?.id,
      ticketCode: result.booking ? getTicketCode(result.booking.id) : null,
    });
  } catch (error) {
    console.error('VNPay return error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// VNPay IPN endpoint
export const handleVnpayIpn = async (req, res) => {
  try {
    const result = await processVnpayResult(req.query);
    return res.status(200).json({
      RspCode: result.code,
      Message: result.message,
    });
  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.status(200).json({
      RspCode: '99',
      Message: error.message,
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Validate user access
    if (payment.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      message: 'Payment details',
      payment: {
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        bankTransferDate: payment.bankTransferDate,
        bankSenderName: payment.bankSenderName,
        verifiedAt: payment.verifiedAt,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Verify bank transfer payment
export const verifyBankTransfer = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      bankSenderName,
      bankSenderAccount,
      transactionRef,
      bankTransferDate,
      bankTransferTime,
      verificationNote,
    } = req.body;
    const adminId = req.user.id;

    // Validate user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can verify payments' });
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        error: 'Payment already processed',
        currentStatus: payment.status,
      });
    }

    // Update payment as verified
    payment.status = 'verified';
    payment.bankSenderName = bankSenderName;
    payment.bankSenderAccount = bankSenderAccount;
    payment.transactionRef = transactionRef;
    payment.bankTransferDate = bankTransferDate;
    payment.bankTransferTime = bankTransferTime;
    payment.verifiedBy = adminId;
    payment.verifiedAt = new Date();
    payment.verificationNote = verificationNote || '';
    await payment.save();

    // Update booking payment status to paid
    const booking = await Booking.findByPk(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      applyCarrierCommission(booking);
      if (!booking.history) booking.history = [];
      booking.history.push({
        event: 'CARRIER_COMMISSION_APPLIED',
        rate: CARRIER_COMMISSION_RATE,
        commissionAmount: booking.commissionAmount,
        carrierRevenue: booking.carrierRevenue,
        timestamp: new Date(),
      });
      await booking.save();

      const [user, trip] = await Promise.all([
        User.findByPk(booking.userId, { attributes: ['email', 'fullName'] }),
        Trip.findByPk(booking.tripId),
      ]);

      if (user?.email && trip) {
        try {
          await sendBookingConfirmation(user.email, {
            ticketCode: getTicketCode(booking.id),
            fullName: user.fullName,
            from: trip.from,
            to: trip.to,
            date: trip.date,
            departure: trip.departure,
            arrival: trip.arrival,
            bus: trip.bus,
            seats: getSelectedSeatLabels(booking.items),
            seatCount: getSeatCount(booking.items),
            total: booking.total,
            paymentMethod: getPaymentMethodLabel(booking.paymentMethod),
          });
        } catch (emailError) {
          console.error('Failed to send verified booking email:', emailError);
        }
      }
    }

    return res.status(200).json({
      message: 'Payment verified successfully',
      payment: {
        id: payment.id,
        status: payment.status,
        verifiedAt: payment.verifiedAt,
        commissionRate: booking?.commissionRate,
        commissionAmount: booking?.commissionAmount,
        carrierRevenue: booking?.carrierRevenue,
      },
    });
  } catch (error) {
    console.error('Verify bank transfer error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Reject bank transfer payment
export const rejectBankTransfer = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Validate user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can reject payments' });
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        error: 'Payment already processed',
        currentStatus: payment.status,
      });
    }

    // Update payment as failed
    payment.status = 'failed';
    payment.verifiedBy = adminId;
    payment.verifiedAt = new Date();
    payment.verificationNote = reason || 'Payment rejected by admin';
    await payment.save();

    // Update booking payment status to failed
    const booking = await Booking.findByPk(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
    }

    return res.status(200).json({
      message: 'Payment rejected',
      payment: {
        id: payment.id,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('Reject bank transfer error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get pending bank transfers
export const getPendingBankTransfers = async (req, res) => {
  try {
    // Validate user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view pending payments' });
    }

    const payments = await Payment.findAll({
      where: { status: 'pending', paymentMethod: 'bank_transfer' },
      include: [
        { model: Booking, attributes: ['id', 'items', 'total', 'createdAt'] },
        { model: User, attributes: ['id', 'email', 'fullName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      message: 'Pending bank transfers',
      count: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        bookingId: p.bookingId,
        userId: p.userId,
        amount: p.amount,
        status: p.status,
        user: {
          email: p.User?.email,
          fullName: p.User?.fullName,
          phone: p.User?.phone,
        },
        booking: {
          items: p.Booking?.items,
          total: p.Booking?.total,
        },
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get pending bank transfers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all payments (with filter)
export const getPaymentsAdmin = async (req, res) => {
  try {
    // Validate user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view payments' });
    }

    const { status, method, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (method) where.paymentMethod = method;

    const payments = await Payment.findAll({
      where,
      include: [
        { model: Booking, attributes: ['id', 'items', 'total'] },
        { model: User, attributes: ['id', 'email', 'fullName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await Payment.count({ where });

    return res.status(200).json({
      message: 'Payments',
      total,
      count: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        bookingId: p.bookingId,
        userId: p.userId,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        user: {
          fullName: p.User?.fullName,
          email: p.User?.email,
          phone: p.User?.phone,
        },
        booking: {
          items: p.Booking?.items,
          total: p.Booking?.total,
        },
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
      })),
    });
  } catch (error) {
    console.error('Get payments admin error:', error);
    res.status(500).json({ error: error.message });
  }
};
