import transporter from '../config/mailer';
import { SendOTPRequest, SendOTPResponse } from '../types/email';
import { getOTPEmailTemplate, validateEmail, validateOTP } from '../utils/emailUtils';

export const sendOTPEmail = async (
  request: SendOTPRequest
): Promise<SendOTPResponse> => {
  try {
    const { to_email, to_name, otp_code } = request;

    // Validate email format
    if (!validateEmail(to_email)) {
      return {
        success: false,
        message: 'Invalid email address',
        error: 'Email validation failed',
      };
    }

    // Validate OTP format
    if (!validateOTP(otp_code)) {
      return {
        success: false,
        message: 'Invalid OTP format',
        error: 'OTP must be a 6-digit number',
      };
    }

    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    const htmlContent = getOTPEmailTemplate(to_name, otp_code, expiryMinutes);

    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.GMAIL_USER}>`,
      to: to_email,
      subject: process.env.EMAIL_SUBJECT_OTP || 'Your Talent-X Verification Code',
      html: htmlContent,
      text: `Your Talent-X verification code is: ${otp_code}\n\nThis code expires in ${expiryMinutes} minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to_email,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `OTP sent successfully to ${to_email}`,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Email send error:', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      message: 'Failed to send email. Please try again.',
      error: errorMessage,
    };
  }
};
