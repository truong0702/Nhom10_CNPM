import { Feedback, Booking, SupportSurvey } from '../models/index.js';

export const createFeedback = async (req, res) => {
  try {
    const { bookingId, type, content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nội dung không được để trống' });
    }

    // Verify booking belongs to user if bookingId provided
    if (bookingId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        return res.status(400).json({ error: 'Mã đặt vé không đúng định dạng (UUID)' });
      }
      const booking = await Booking.findOne({ where: { id: bookingId, userId } });
      if (!booking) {
        return res.status(404).json({ error: 'Không tìm thấy đơn đặt vé' });
      }
    }

    const feedback = await Feedback.create({
      userId,
      bookingId: bookingId || null,
      type: type || 'feedback',
      content: content.trim(),
    });

    return res.status(201).json({ message: 'Gửi góp ý thành công', feedback });
  } catch (error) {
    console.error('createFeedback error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

export const getMyFeedbacks = async (req, res) => {
  try {
    const userId = req.user.id;
    const feedbacks = await Feedback.findAll({
      where: { userId },
      include: [
        {
          model: SupportSurvey,
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ feedbacks });
  } catch (error) {
    console.error('getMyFeedbacks error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};
