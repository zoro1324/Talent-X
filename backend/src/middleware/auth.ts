import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

/**
 * Extended Request interface with user data
 */
export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

/**
 * JWT Payload interface
 */
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Find user by primary key (id)
    const user = await User.findByPk(parseInt(decoded.userId, 10));

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const user = await User.findByPk(parseInt(decoded.userId, 10));

    if (user) {
      req.user = user;
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Generate JWT Token
 */
export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiry = process.env.JWT_EXPIRY || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    { userId, email },
    jwtSecret,
    { expiresIn: jwtExpiry as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '30d';

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(
    { userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshExpiry as jwt.SignOptions['expiresIn'] }
  );
};
