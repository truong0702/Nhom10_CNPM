import { Payment, Booking, User } from '../models/index.js';

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
      await booking.save();
    }

    return res.status(200).json({
      message: 'Payment verified successfully',
      payment: {
        id: payment.id,
        status: payment.status,
        verifiedAt: payment.verifiedAt,
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
