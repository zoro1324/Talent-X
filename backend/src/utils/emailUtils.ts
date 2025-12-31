import { SendOTPRequest } from '../types/email';

export const getOTPEmailTemplate = (
  toName: string,
  otpCode: string,
  expiryMinutes: number = 10
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
        .otp-container { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 4px; }
        .otp-code { font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; font-family: 'Courier New', monospace; }
        .otp-note { font-size: 14px; color: #666; margin-top: 15px; }
        .expiry { color: #e74c3c; font-weight: bold; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .footer-text { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Talent-X</h1>
          <p>Email Verification</p>
        </div>
        <div class="content">
          <div class="greeting">
            <p>Hello <strong>${toName}</strong>,</p>
            <p>Thank you for signing up with Talent-X. Your verification code is ready.</p>
          </div>
          <div class="otp-container">
            <p style="margin-top: 0; color: #666; font-size: 14px;">Your Verification Code</p>
            <div class="otp-code">${otpCode}</div>
            <div class="otp-note">
              This code will expire in <span class="expiry">${expiryMinutes} minutes</span>
            </div>
          </div>
          <div style="margin-top: 30px; padding: 15px; background-color: #fffbea; border-radius: 4px; border-left: 4px solid #f39c12;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>⚠️ Security Tip:</strong> Never share this code with anyone. Talent-X support will never ask for your verification code.
            </p>
          </div>
          <div style="margin-top: 20px; color: #666; font-size: 14px;">
            <p>If you didn't request this verification code, please ignore this email or contact our support team.</p>
          </div>
        </div>
        <div class="footer">
          <div class="footer-text">© ${new Date().getFullYear()} Talent-X. All rights reserved.</div>
          <div class="footer-text">This is an automated message. Please do not reply to this email.</div>
          <div class="footer-text">If you have questions, visit our website or contact support.</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};
