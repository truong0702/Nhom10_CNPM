import { ChatMessage, User } from '../models/index.js';

const SUPPORT_AUTO_REPLY =
  'Cảm ơn bạn đã nhắn tin. Yêu cầu hỗ trợ của bạn đã được ghi nhận, nhân viên sẽ phản hồi trong vài phút.';

const serverError = (res) => res.status(500).json({ error: 'Lỗi server' });
const emptyMessageError = (res) =>
  res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });

export const getMyChatMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
    });
    return res.json({ messages });
  } catch (error) {
    console.error('getMyChatMessages error:', error);
    return serverError(res);
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return emptyMessageError(res);
    }

    const chatMessage = await ChatMessage.create({
      userId,
      senderId: userId,
      senderRole: 'user',
      content: content.trim(),
    });

    const autoReply = await ChatMessage.create({
      userId,
      senderId: userId,
      senderRole: 'admin',
      content: SUPPORT_AUTO_REPLY,
      isAutoReply: true,
    });

    return res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      chatMessage,
      autoReply,
      messages: [chatMessage, autoReply],
    });
  } catch (error) {
    console.error('sendChatMessage error:', error);
    return serverError(res);
  }
};

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
      const current = conversationMap.get(msg.userId) || {
        userId: msg.userId,
        user: msg.User,
        lastMessage: '',
        lastMessageAt: null,
        lastCustomerMessage: '',
        lastCustomerMessageAt: null,
        lastHumanAdminReplyAt: null,
      };

      if (!current.lastMessageAt || msg.createdAt > current.lastMessageAt) {
        current.lastMessage = msg.content;
        current.lastMessageAt = msg.createdAt;
      }

      if (msg.senderRole === 'user' && (!current.lastCustomerMessageAt || msg.createdAt > current.lastCustomerMessageAt)) {
        current.lastCustomerMessage = msg.content;
        current.lastCustomerMessageAt = msg.createdAt;
      }

      if (
        msg.senderRole === 'admin' &&
        !msg.isAutoReply &&
        (!current.lastHumanAdminReplyAt || msg.createdAt > current.lastHumanAdminReplyAt)
      ) {
        current.lastHumanAdminReplyAt = msg.createdAt;
      }

      conversationMap.set(msg.userId, current);
    }

    const conversations = Array.from(conversationMap.values()).map((conversation) => {
      const lastCustomerAt = conversation.lastCustomerMessageAt
        ? new Date(conversation.lastCustomerMessageAt).getTime()
        : 0;
      const lastHumanAdminAt = conversation.lastHumanAdminReplyAt
        ? new Date(conversation.lastHumanAdminReplyAt).getTime()
        : 0;
      const pendingCount = allMessages.filter((msg) => {
        if (msg.userId !== conversation.userId || msg.senderRole !== 'user') return false;
        return new Date(msg.createdAt).getTime() > lastHumanAdminAt;
      }).length;

      return {
        ...conversation,
        lastMessage: conversation.lastCustomerMessage || conversation.lastMessage,
        lastMessageAt: conversation.lastCustomerMessageAt || conversation.lastMessageAt,
        pendingSupport: lastCustomerAt > lastHumanAdminAt,
        pendingCount,
      };
    });

    conversations.sort((a, b) => {
      if (a.pendingSupport !== b.pendingSupport) return a.pendingSupport ? -1 : 1;
      return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
    });

    return res.json({ conversations });
  } catch (error) {
    console.error('getAdminConversations error:', error);
    return serverError(res);
  }
};

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
    return serverError(res);
  }
};

export const sendAdminChatMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return emptyMessageError(res);
    }

    const chatMessage = await ChatMessage.create({
      userId,
      senderId: req.user.id,
      senderRole: 'admin',
      content: content.trim(),
      isAutoReply: false,
    });

    return res.status(201).json({ message: 'Gửi tin nhắn thành công', chatMessage });
  } catch (error) {
    console.error('sendAdminChatMessage error:', error);
    return serverError(res);
  }
};
