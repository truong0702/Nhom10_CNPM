import { ChatMessage, User } from '../models/index.js';

// Customers: Get all chat messages for current user
export const getMyChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await ChatMessage.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
    });
    return res.json({ messages });
  } catch (error) {
    console.error('getMyChatMessages error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

// Customers: Send a chat message
export const sendChatMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    const message = await ChatMessage.create({
      userId,
      senderId: userId,
      senderRole: 'user',
      content: content.trim(),
    });

    return res.status(201).json({ message: 'Gửi tin nhắn thành công', chatMessage: message });
  } catch (error) {
    console.error('sendChatMessage error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

// Admin: Get all active customer conversations
export const getAdminConversations = async (req, res) => {
  try {
    const allMessages = await ChatMessage.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
      ],
    });

    const conversationMap = new Map();
    for (const msg of allMessages) {
      if (!conversationMap.has(msg.userId)) {
        conversationMap.set(msg.userId, {
          userId: msg.userId,
          user: msg.User,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
        });
      }
    }

    const conversations = Array.from(conversationMap.values());
    return res.json({ conversations });
  } catch (error) {
    console.error('getAdminConversations error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

// Admin: Get chat messages for a specific customer
export const getAdminChatMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await ChatMessage.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
    });
    return res.json({ messages });
  } catch (error) {
    console.error('getAdminChatMessages error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

// Admin: Send chat message to a customer
export const sendAdminChatMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    const message = await ChatMessage.create({
      userId,
      senderId,
      senderRole: 'admin',
      content: content.trim(),
    });

    return res.status(201).json({ message: 'Gửi tin nhắn thành công', chatMessage: message });
  } catch (error) {
    console.error('sendAdminChatMessage error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};
