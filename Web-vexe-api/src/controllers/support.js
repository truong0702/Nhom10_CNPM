export const getFaqs = async (req, res) => {
  try {
    const faqs = [
      { q: 'Làm sao để đặt vé xe?', a: 'Bạn vào trang chủ, chọn tuyến xe, chọn ghế, điền thông tin hành khách rồi thanh toán.' },
      { q: 'Tôi có thể hủy vé không?', a: 'Có. Vào "Vé của tôi", chọn vé cần hủy và nhấn nút Hủy vé. Phí hủy là 10% giá vé.' },
      { q: 'Phương thức thanh toán nào được hỗ trợ?', a: 'Chúng tôi hỗ trợ thanh toán qua Ví điện tử, Chuyển khoản ngân hàng và Thanh toán tại trạm.' },
      { q: 'Làm sao để đổi vé?', a: 'Vào "Vé của tôi", chọn vé cần đổi và nhấn nút Đổi vé. Phí đổi vé là 5% giá vé.' },
      { q: 'Tôi quên mật khẩu thì phải làm sao?', a: 'Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập email và làm theo hướng dẫn.' },
      { q: 'Mã QR vé dùng để làm gì?', a: 'Mã QR chứa thông tin vé của bạn. Nhân viên soát vé sẽ quét mã QR khi bạn lên xe.' },
      { q: 'Tôi có thể xem lịch sử đặt vé không?', a: 'Có. Vào "Vé của tôi" để xem toàn bộ lịch sử đặt vé, bao gồm vé đã hủy.' },
      { q: 'Làm sao để liên hệ nhà xe?', a: 'Bạn có thể gửi góp ý/khiếu nại qua tab "Gửi góp ý" hoặc chat trực tuyến tại đây.' },
      { q: 'Thời gian hoàn tiền sau khi hủy vé?', a: 'Tiền sẽ được hoàn vào ví điện tử ngay lập tức sau khi hủy vé thành công.' },
      { q: 'Tôi có thể chọn ghế cụ thể không?', a: 'Có. Trong bước chọn ghế, bạn sẽ thấy sơ đồ ghế và có thể chọn ghế mong muốn.' },
    ];
    return res.json({ faqs });
  } catch (error) {
    console.error('Get FAQs error:', error);
    return res.status(500).json({ error: error.message });
  }
};
