/**
 * Email Service for sending OTP via EmailJS
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://www.emailjs.com/ and create a free account
 * 2. Add an Email Service (Gmail recommended):
 *    - Click "Add New Service"
 *    - Select "Gmail"
 *    - Connect your Gmail account
 *    - Note the Service ID (e.g., "service_xxxxxxx")
 * 
 * 3. Create an Email Template:
 *    - Click "Email Templates" → "Create New Template"
 *    - Subject: "Your Talent-X Verification Code: {{otp_code}}"
 *    - Content:
 *      ```
 *      Hello {{to_name}},
 *      
 *      Your verification code for Talent-X is:
 *      
 *      {{otp_code}}
 *      
 *      This code will expire in 10 minutes.
 *      
 *      If you didn't request this code, please ignore this email.
 *      
 *      Best regards,
 *      Talent-X Team
 *      ```
 *    - Set "To Email" field to: {{to_email}}
 *    - Note the Template ID (e.g., "template_xxxxxxx")
 * 
 * 4. Get your Public Key:
 *    - Go to "Account" → "API Keys"
 *    - Copy your Public Key
 * 
 * 5. Update the values below with your credentials
 */

// ============================================
// REPLACE THESE WITH YOUR EMAILJS CREDENTIALS
// ============================================
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_gkp95us',   // Replace with your Service ID
  TEMPLATE_ID: 'template_3v60mbi', // Replace with your Template ID
  PUBLIC_KEY: 'csQ8KlrUU5lsn7CAf',   // Replace with your Public Key
};

// Check if EmailJS is configured
const isEmailJSConfigured = (): boolean => {
  return (
    EMAILJS_CONFIG.SERVICE_ID !== 'service_xxxxxxx' &&
    EMAILJS_CONFIG.TEMPLATE_ID !== 'template_xxxxxxx' &&
    EMAILJS_CONFIG.PUBLIC_KEY !== 'xxxxxxxxxxxxxxx'
  );
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email using EmailJS
 * @param email - Recipient email address
 * @param otpCode - 6-digit OTP code
 * @returns Object with success status and message
 */
export const sendOTPEmail = async (
  email: string,
  otpCode: string
): Promise<{ success: boolean; message: string; otpForDemo?: string }> => {
  
  // Check if EmailJS is configured
  if (!isEmailJSConfigured()) {
    console.log('EmailJS not configured. Demo mode active.');
    return {
      success: true,
      message: 'Demo Mode: EmailJS not configured',
      otpForDemo: otpCode,
    };
  }

  try {
    const templateParams = {
      to_email: email,
      to_name: email.split('@')[0],
      otp_code: otpCode,
      app_name: 'Talent-X',
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: `OTP sent successfully to ${email}`,
      };
    } else {
      const errorText = await response.text();
      console.error('EmailJS Error:', errorText);
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
 * Alternative: Send OTP using Web3Forms (another free option)
 * Sign up at https://web3forms.com/ to get an access key
 */
export const sendOTPViaWeb3Forms = async (
  email: string,
  otpCode: string,
  accessKey: string
): Promise<boolean> => {
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Talent-X Verification Code: ${otpCode}`,
        from_name: 'Talent-X',
        to: email,
        message: `Your Talent-X verification code is: ${otpCode}\n\nThis code expires in 10 minutes.`,
      }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Web3Forms error:', error);
    return false;
  }
};
