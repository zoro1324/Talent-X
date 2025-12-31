import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken, generateRefreshToken, AuthRequest } from '../middleware/auth';
import { sendOTPEmail } from '../services/emailService';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
    });

    // Generate OTP for verification
    const otp = user.generateOTP();
    await user.save();

    // Send verification email
    await sendOTPEmail({
      to_email: user.email,
      to_name: `${firstName} ${lastName}`,
      otp_code: otp,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Verify email with OTP
 * POST /api/auth/verify-otp
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    if (!user.verificationOTP || !user.otpExpiry) {
      res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
      return;
    }

    if (new Date() > user.otpExpiry) {
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
      return;
    }

    if (user.verificationOTP !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
      return;
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.otpExpiry = null;
    await user.save();

    // Generate tokens
    const token = generateToken(user.id.toString(), user.email);
    const refreshToken = generateRefreshToken(user.id.toString());

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail({
      to_email: user.email,
      to_name: `${user.firstName} ${user.lastName}`,
      otp_code: otp,
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if verified
    if (!user.isVerified) {
      // Generate new OTP
      const otp = user.generateOTP();
      await user.save();

      // Send OTP
      await sendOTPEmail({
        to_email: user.email,
        to_name: `${user.firstName} ${user.lastName}`,
        otp_code: otp,
      });

      res.status(403).json({
        success: false,
        message: 'Email not verified. A new verification code has been sent.',
        requiresVerification: true,
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user.id.toString(), user.email);
    const refreshToken = generateRefreshToken(user.id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isVerified', 'createdAt', 'lastLogin'],
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/me
 */
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password (will be hashed by hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

/**
 * Forgot password - request reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Don't reveal if user exists
      res.status(200).json({
        success: true,
        message: 'If the email exists, a reset code has been sent.',
      });
      return;
    }

    // Generate OTP for password reset
    const otp = user.generateOTP();
    await user.save();

    // Send reset email
    await sendOTPEmail({
      to_email: user.email,
      to_name: `${user.firstName} ${user.lastName}`,
      otp_code: otp,
    });

    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
    });
  }
};

/**
 * Reset password with OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid request',
      });
      return;
    }

    if (!user.verificationOTP || !user.otpExpiry) {
      res.status(400).json({
        success: false,
        message: 'No reset code found. Please request a new one.',
      });
      return;
    }

    if (new Date() > user.otpExpiry) {
      res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      });
      return;
    }

    if (user.verificationOTP !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid reset code',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    user.verificationOTP = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};
