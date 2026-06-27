import {
  calculateFee,
  getReconciliation,
  getRevenueReport,
  recordCodRevenue,
  recordOnlineSplit,
} from '../services/finance.js';

export const calculateServiceFee = async (req, res) => {
  try {
    return res.json({ fee: calculateFee(req.body) });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const splitPayment = async (req, res) => {
  try {
    const record = await recordOnlineSplit(req.body);
    return res.status(201).json({ message: 'Payment split recorded successfully', record });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const recordCodPayment = async (req, res) => {
  try {
    const record = await recordCodRevenue(req.body);
    return res.status(201).json({ message: 'COD revenue recorded successfully', record });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const reconciliation = async (req, res) => {
  try {
    const result = await getReconciliation(req.query);
    return res.json({ reconciliation: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const revenueReport = async (req, res) => {
  try {
    const report = await getRevenueReport(req.query);
    return res.json({ report });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
