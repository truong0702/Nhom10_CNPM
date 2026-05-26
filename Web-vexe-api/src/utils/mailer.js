// Mailer utility - logs emails for development
// In production, connect to real email service

export const sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vexe.com',
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

    // Log instead of sending (for development)
    console.log('[EMAIL] Reset password email:');
    console.log('  To:', email);
    console.log('  Reset URL:', resetUrl);
    
    // TODO: Integrate with nodemailer in production
    // await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (email, bookingDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vexe.com',
      to: email,
      subject: 'Booking Confirmation - VeXe',
      html: `
        <h2>Booking Confirmed</h2>
        <p>Your booking has been confirmed!</p>
        <p><strong>Trip:</strong> ${bookingDetails.from} - ${bookingDetails.to}</p>
        <p><strong>Date:</strong> ${bookingDetails.date}</p>
        <p><strong>Seats:</strong> ${bookingDetails.seats}</p>
        <p><strong>Total:</strong> ${bookingDetails.total} VND</p>
      `,
    };

    console.log('[EMAIL] Booking confirmation email to:', email);
    
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export default {
  sendResetPasswordEmail,
  sendBookingConfirmation,
};
