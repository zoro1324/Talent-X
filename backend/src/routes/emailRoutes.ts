import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendOTPEmail } from '../services/emailService';
import { SendOTPRequest } from '../types/email';

const router = Router();

/**
 * POST /api/send-otp
 * Send OTP email to user
 */
router.post(
  '/send-otp',
  [
    body('to_email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('to_name')
      .trim()
      .notEmpty()
      .withMessage('User name is required'),
    body('otp_code')
      .matches(/^\d{6}$/)
      .withMessage('OTP must be a 6-digit number'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const payload: SendOTPRequest = req.body;

      // Send OTP email
      const result = await sendOTPEmail(payload);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Route handler error:', errorMessage);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      });
    }
  }
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
