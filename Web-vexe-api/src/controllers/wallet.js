import Wallet from '../models/Wallet.js';

export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wallet = await Wallet.findOne({ where: { userId } });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0, history: [] });
    }
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        history: wallet.history || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getWalletHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wallet = await Wallet.findOne({ where: { userId } });
    
    if (!wallet) {
      return res.json({ success: true, data: [] });
    }
    
    const sortedHistory = (wallet.history || []).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.json({ success: true, data: sortedHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};