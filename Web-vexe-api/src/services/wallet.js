import Wallet from '../models/Wallet.js';
import User from '../models/User.js';

export const getWalletBalance = async (userId) => {
  let wallet = await Wallet.findOne({ where: { userId } });
  
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0 });
  }
  
  return wallet;
};

export const addWalletCredit = async (userId, amount, meta = {}) => {
  const wallet = await getWalletBalance(userId);
  const oldBalance = Number(wallet.balance || 0);
  
  wallet.balance = oldBalance + Number(amount || 0);
  wallet.history = wallet.history || [];
  
  wallet.history.push({
    type: amount > 0 ? 'credit' : 'debit',
    amount: Math.abs(amount),
    balance: wallet.balance,
    meta,
    timestamp: new Date(),
  });
  
  await wallet.save();
  
  return wallet;
};

export const getWalletHistory = async (userId) => {
  const wallet = await getWalletBalance(userId);
  return wallet.history || [];
};

export default { getWalletBalance, addWalletCredit, getWalletHistory };
