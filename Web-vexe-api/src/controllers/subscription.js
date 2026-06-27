import {
  cancelSubscription,
  getPaymentHistory,
  registerSubscription,
  renewSubscription,
} from '../services/subscription.js';

export const createSubscription = async (req, res) => {
  try {
    const subscription = await registerSubscription({
      ...req.body,
      userId: req.body.userId || req.user?.id,
    });
    return res.status(201).json({ message: 'Subscription registered successfully', subscription });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const renewSubscriptionById = async (req, res) => {
  try {
    const subscription = await renewSubscription(req.params.id, req.body);
    return res.json({ message: 'Subscription renewed successfully', subscription });
  } catch (error) {
    const status = error.message === 'Subscription not found' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
};

export const cancelSubscriptionById = async (req, res) => {
  try {
    const subscription = await cancelSubscription(req.params.id, req.body);
    return res.json({ message: 'Subscription cancelled successfully', subscription });
  } catch (error) {
    const status = error.message === 'Subscription not found' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
};

export const getSubscriptionPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.role === 'admin' ? req.query.userId || null : req.user?.id || null;
    const payments = await getPaymentHistory(userId);
    return res.json({ payments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
