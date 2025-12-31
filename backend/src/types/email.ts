interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendOTPRequest {
  to_email: string;
  to_name: string;
  otp_code: string;
  sender_email?: string;
  sender_name?: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export { EmailOptions, SendOTPRequest, SendOTPResponse };
