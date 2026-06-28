// Mailer utility. Sends via SMTP when configured, otherwise logs in development.

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(Number(amount || 0));

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const detailRow = (label, value) => `
  <tr>
    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">${label}</td>
    <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(value)}</td>
  </tr>
`;

const getTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!host || !user || !pass) return null;

  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
};

const sendMail = async (mailOptions) => {
  const transporter = await getTransporter();
  if (!transporter) {
    console.log('[EMAIL] SMTP is not configured. Email preview:');
    console.log('  To:', mailOptions.to);
    console.log('  Subject:', mailOptions.subject);
    console.log('  Text:', mailOptions.text || mailOptions.html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    return { success: true, skipped: true };
  }

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vexe.com',
      to: email,
      subject: 'Reset Your Password - VeXe',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your VeXe account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    return await sendMail({
      ...mailOptions,
      text: `Reset your VeXe password: ${resetUrl}`,
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (email, bookingDetails) => {
  try {
    const seats = Array.isArray(bookingDetails.seats)
      ? bookingDetails.seats.join(', ')
      : bookingDetails.seats || 'Chưa chọn ghế';
    const route = `${bookingDetails.from} → ${bookingDetails.to}`;
    const total = `${formatCurrency(bookingDetails.total)} VND`;
    const subject = `Vé ${bookingDetails.ticketCode} đã được xác nhận - VeXe`;
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vexe.com',
      to: email,
      subject,
      html: `
        <div style="margin: 0; padding: 0; background: #f3f4f6;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f3f4f6; padding: 28px 12px; font-family: Arial, Helvetica, sans-serif;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; overflow: hidden; border-radius: 18px; background: #ffffff; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);">
                  <tr>
                    <td style="background: #dc2626; padding: 26px 30px; color: #ffffff;">
                      <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9;">VeXe</div>
                      <div style="margin-top: 8px; font-size: 26px; line-height: 1.2; font-weight: 800;">Vé của bạn đã được xác nhận</div>
                      <div style="margin-top: 8px; font-size: 14px; opacity: 0.92;">Cảm ơn bạn đã đặt vé cùng VeXe.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px 30px 8px;">
                      <p style="margin: 0 0 14px; color: #334155; font-size: 15px; line-height: 1.6;">
                        Xin chào <strong style="color: #0f172a;">${escapeHtml(bookingDetails.fullName || 'quý khách')}</strong>,
                      </p>
                      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
                        Thanh toán của bạn đã được xác nhận. Vui lòng lưu mã vé và xuất trình khi lên xe.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px 30px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                        <tr>
                          <td style="background: #fff7ed; padding: 18px 20px; border-bottom: 1px solid #fed7aa;">
                            <div style="color: #9a3412; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">Mã vé</div>
                            <div style="margin-top: 6px; color: #0f172a; font-size: 30px; font-weight: 900; letter-spacing: 0.04em;">${escapeHtml(bookingDetails.ticketCode)}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 18px 20px;">
                            <div style="color: #0f172a; font-size: 20px; line-height: 1.35; font-weight: 800;">${escapeHtml(route)}</div>
                            <div style="margin-top: 6px; color: #64748b; font-size: 13px;">${escapeHtml(bookingDetails.date)} • ${escapeHtml(bookingDetails.departure)} - ${escapeHtml(bookingDetails.arrival)}</div>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px; border-top: 1px solid #e2e8f0;">
                              ${detailRow('Xe', bookingDetails.bus)}
                              ${detailRow('Ghế', seats)}
                              ${detailRow('Số lượng ghế', bookingDetails.seatCount)}
                              ${detailRow('Phương thức thanh toán', bookingDetails.paymentMethod)}
                              ${detailRow('Tổng tiền', total)}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 22px 30px 30px;">
                      <div style="border-radius: 14px; background: #f8fafc; padding: 16px 18px; color: #475569; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #0f172a;">Lưu ý:</strong> Vui lòng có mặt tại điểm đón trước giờ khởi hành ít nhất 15 phút. Nếu cần hỗ trợ, hãy liên hệ bộ phận chăm sóc khách hàng của VeXe.
                      </div>
                      <div style="margin-top: 18px; color: #94a3b8; font-size: 12px; text-align: center;">
                        Email này được gửi tự động từ hệ thống VeXe. Vui lòng không trả lời email này.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
      text: [
        `Ve da duoc xac nhan - ${bookingDetails.ticketCode}`,
        `Khach hang: ${bookingDetails.fullName || ''}`,
        `Tuyen: ${bookingDetails.from} - ${bookingDetails.to}`,
        `Ngay di: ${bookingDetails.date}`,
        `Gio di: ${bookingDetails.departure}`,
        `Gio den: ${bookingDetails.arrival}`,
        `Xe: ${bookingDetails.bus}`,
        `Ghe: ${seats}`,
        `Tong tien: ${total}`,
        `Thanh toan: ${bookingDetails.paymentMethod}`,
      ].join('\n'),
    };

    return await sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export default {
  sendResetPasswordEmail,
  sendBookingConfirmation,
};
