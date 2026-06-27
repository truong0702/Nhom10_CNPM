import test from 'node:test';
import assert from 'node:assert';

// Business logic helper functions representing CSKH actions
function validateFeedbackPayload(payload) {
  if (!payload.bookingId) throw new Error('Booking ID is required');
  if (!payload.message || !payload.message.trim()) {
    throw new Error('Feedback message is required');
  }
  if (payload.imagePath && !/\.(jpg|jpeg|png|webp)$/i.test(payload.imagePath)) {
    throw new Error('Invalid image attachment format');
  }
  return {
    bookingId: payload.bookingId,
    message: payload.message.trim(),
    imagePath: payload.imagePath || null,
  };
}

function processSupportSurvey(survey) {
  const rating = parseInt(survey.rating, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
  return {
    rating,
    comments: survey.comments ? survey.comments.trim() : '',
  };
}

function searchFaqData(faqsList, query) {
  if (!query || !query.trim()) return faqsList;
  const q = query.trim().toLowerCase();
  return faqsList.filter(item => 
    item.q.toLowerCase().includes(q) || 
    item.a.toLowerCase().includes(q)
  );
}

test('UC50 - CSKH: feedback validation rules', () => {
  // Valid payload
  const valid = validateFeedbackPayload({
    bookingId: 'booking-111',
    message: ' Nice support! ',
    imagePath: 'screenshot.png',
  });
  assert.strictEqual(valid.bookingId, 'booking-111');
  assert.strictEqual(valid.message, 'Nice support!');
  assert.strictEqual(valid.imagePath, 'screenshot.png');
  
  // Missing bookingId
  assert.throws(() => {
    validateFeedbackPayload({ message: 'No booking id' });
  }, /Booking ID is required/);
  
  // Empty message
  assert.throws(() => {
    validateFeedbackPayload({ bookingId: 'booking-111', message: '   ' });
  }, /Feedback message is required/);

  // Invalid image extension
  assert.throws(() => {
    validateFeedbackPayload({ bookingId: 'booking-111', message: 'Hello', imagePath: 'file.pdf' });
  }, /Invalid image attachment format/);
});

test('UC52 - CSKH: satisfaction survey feedback checks', () => {
  // Valid survey rating
  const result = processSupportSurvey({ rating: 5, comments: '   Excellent!   ' });
  assert.strictEqual(result.rating, 5);
  assert.strictEqual(result.comments, 'Excellent!');
  
  // Too low rating
  assert.throws(() => {
    processSupportSurvey({ rating: 0 });
  }, /Rating must be an integer between 1 and 5/);
  
  // Too high rating
  assert.throws(() => {
    processSupportSurvey({ rating: 6 });
  }, /Rating must be an integer between 1 and 5/);

  // String numeric rating parsed
  const parsed = processSupportSurvey({ rating: '3' });
  assert.strictEqual(parsed.rating, 3);
});

test('UC53 - CSKH: filter FAQ list items', () => {
  const faqs = [
    { q: 'Làm thế nào để đổi vé?', a: 'Vào Vé của tôi và chọn đổi vé.' },
    { q: 'Phương thức thanh toán?', a: 'Hỗ trợ thẻ ATM và QR Code.' },
    { q: 'Phí hủy vé là bao nhiêu?', a: 'Phí hủy là 10% giá trị vé.' },
  ];
  
  // Search query match in question
  const matchesQ = searchFaqData(faqs, 'phương thức');
  assert.strictEqual(matchesQ.length, 1);
  assert.strictEqual(matchesQ[0].q, 'Phương thức thanh toán?');
  
  // Search query match in answer
  const matchesA = searchFaqData(faqs, 'ATM');
  assert.strictEqual(matchesA.length, 1);
  assert.strictEqual(matchesA[0].q, 'Phương thức thanh toán?');

  // Empty query returns everything
  const allFaqs = searchFaqData(faqs, '  ');
  assert.strictEqual(allFaqs.length, 3);
});
