/**
 * Email Service for sending OTP via Google SMTP
 * 
 * SETUP INSTRUCTIONS FOR GOOGLE SMTP:
 * 
 * 1. Set up Gmail Account (naveen13524g@gmail.com):
 *    - Go to https://myaccount.google.com/security
 *    - Enable 2-Step Verification
 * 
 * 2. Create App Password:
 *    - Go to https://myaccount.google.com/apppasswords
 *    - Select "Mail" and "Windows Computer" (or your device)
 *    - Generate a 16-character password
 *    - Copy this password for use below
 * 
 * 3. Set up a Backend Service (Required - don't expose SMTP credentials in client):
 *    Option A: Firebase Cloud Functions (Recommended)
 *      - Create a Cloud Function to handle email sending
 *      - Store credentials in Firebase Environment Config
 *      - This app calls the function endpoint
 * 
 *    Option B: Simple Node.js Backend
 *      - Create a /api/send-otp endpoint
 *      - Use nodemailer library to send emails
 *      - Store credentials in .env file
 * 
 *    Option C: AWS Lambda + SES
 *      - Configure AWS Lambda function
 *      - Use AWS SES for email sending
 * 
 * 4. Update the API endpoint below
 */

// ============================================
// GOOGLE SMTP CONFIGURATION
// ============================================
const GOOGLE_SMTP_CONFIG = {
  SENDER_EMAIL: 'naveen13524g@gmail.com',
  SENDER_NAME: 'Talent-X Team',
  // Update with your backend URL after deployment
  // Local: http://localhost:5000/api/send-otp
  // Production: https://your-production-domain.com/api/send-otp
  BACKEND_API_URL: 'http://localhost:5000/api/send-otp',
};

// Check if backend API is configured
const isBackendConfigured = (): boolean => {
  return GOOGLE_SMTP_CONFIG.BACKEND_API_URL !== 'https://your-backend-api.com/api/send-otp';
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email using Google SMTP via Backend API
 * @param email - Recipient email address
 * @param otpCode - 6-digit OTP code
 * @returns Object with success status and message
 */
export const sendOTPEmail = async (
  email: string,
  otpCode: string
): Promise<{ success: boolean; message: string; otpForDemo?: string }> => {
  
  // Check if backend API is configured
  if (!isBackendConfigured()) {
    console.log('Backend API not configured. Demo mode active.');
    return {
      success: true,
      message: 'Demo Mode: Backend not configured. OTP: ' + otpCode,
      otpForDemo: otpCode,
    };
  }

  try {
    const response = await fetch(GOOGLE_SMTP_CONFIG.BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_email: email,
        to_name: email.split('@')[0],
        otp_code: otpCode,
        sender_email: GOOGLE_SMTP_CONFIG.SENDER_EMAIL,
        sender_name: GOOGLE_SMTP_CONFIG.SENDER_NAME,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `OTP sent successfully to ${email}`,
      };
    } else {
      const errorText = await response.text();
      console.error('Backend API Error:', errorText);
      return {
        success: false,
        message: 'Failed to send email. Please try again.',
        otpForDemo: otpCode,
      };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      otpForDemo: otpCode,
    };
  }
};

/**
 * EXAMPLE BACKEND IMPLEMENTATIONS:
 * 
 * Firebase Cloud Function (Node.js):
 * ```javascript
 * const functions = require("firebase-functions");
 * const nodemailer = require("nodemailer");
 * 
 * const transporter = nodemailer.createTransport({
 *   host: "smtp.gmail.com",
 *   port: 587,
 *   secure: false,
 *   auth: {
 *     user: "naveen13524g@gmail.com",
 *     pass: "your-app-password", // 16-char password from step 2
 *   },
 * });
 * 
 * exports.sendOTP = functions.https.onRequest(async (req, res) => {
 *   const { to_email, to_name, otp_code } = req.body;
 *   
 *   try {
 *     await transporter.sendMail({
 *       from: '"Talent-X Team" <naveen13524g@gmail.com>',
 *       to: to_email,
 *       subject: `Your Talent-X Verification Code: ${otp_code}`,
 *       html: `
 *         <h2>Hello ${to_name},</h2>
 *         <p>Your verification code for Talent-X is:</p>
 *         <h1 style="color: #007AFF;">${otp_code}</h1>
 *         <p>This code will expire in 10 minutes.</p>
 *         <p>If you didn't request this code, please ignore this email.</p>
 *         <p>Best regards,<br/>Talent-X Team</p>
 *       `,
 *     });
 *     res.json({ success: true });
 *   } catch (error) {
 *     console.error(error);
 *     res.status(500).json({ success: false, error: error.message });
 *   }
 * });
 * ```
 */
