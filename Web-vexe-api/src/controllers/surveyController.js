import { SupportSurvey, Feedback } from '../models/index.js';

// Create a satisfaction survey
export const createSupportSurvey = async (req, res) => {
  try {
    const { feedbackId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5 sao' });
    }

    if (feedbackId) {
      const feedback = await Feedback.findOne({ where: { id: feedbackId, userId } });
      if (!feedback) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu hỗ trợ hoặc không có quyền truy cập' });
      }

      // Check if survey already exists for this feedback
      const existing = await SupportSurvey.findOne({ where: { feedbackId } });
      if (existing) {
        return res.status(400).json({ error: 'Yêu cầu hỗ trợ này đã được khảo sát' });
      }
    }

    const survey = await SupportSurvey.create({
      userId,
      feedbackId: feedbackId || null,
      rating: Number(rating),
      comment: comment ? comment.trim() : null,
    });

    return res.status(201).json({ message: 'Gửi khảo sát thành công', survey });
  } catch (error) {
    console.error('createSupportSurvey error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};
