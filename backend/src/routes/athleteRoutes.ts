import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createAthlete,
  getAthletes,
  getAthlete,
  updateAthlete,
  deleteAthlete,
  restoreAthlete,
  getAthleteStats,
} from '../controllers/athleteController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(apiLimiter);

/**
 * @route   POST /api/athletes
 * @desc    Create a new athlete profile
 * @access  Private
 */
router.post(
  '/',
  [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Valid date of birth is required'),
    body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
    body('height')
      .optional()
      .isFloat({ min: 50, max: 300 })
      .withMessage('Height must be between 50 and 300 cm'),
    body('weight')
      .optional()
      .isFloat({ min: 10, max: 500 })
      .withMessage('Weight must be between 10 and 500 kg'),
    body('sport')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Sport cannot exceed 100 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
  ],
  createAthlete
);

/**
 * @route   GET /api/athletes
 * @desc    Get all athletes for current user
 * @access  Private
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim(),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  getAthletes
);

/**
 * @route   GET /api/athletes/:id
 * @desc    Get single athlete by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid athlete ID'),
  ],
  getAthlete
);

/**
 * @route   PUT /api/athletes/:id
 * @desc    Update athlete profile
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid athlete ID'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Valid date of birth is required'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
    body('height')
      .optional()
      .isFloat({ min: 50, max: 300 })
      .withMessage('Height must be between 50 and 300 cm'),
    body('weight')
      .optional()
      .isFloat({ min: 10, max: 500 })
      .withMessage('Weight must be between 10 and 500 kg'),
    body('sport')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Sport cannot exceed 100 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
  ],
  updateAthlete
);

/**
 * @route   DELETE /api/athletes/:id
 * @desc    Soft delete athlete
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid athlete ID'),
  ],
  deleteAthlete
);

/**
 * @route   PATCH /api/athletes/:id/restore
 * @desc    Restore soft-deleted athlete
 * @access  Private
 */
router.patch(
  '/:id/restore',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid athlete ID'),
  ],
  restoreAthlete
);

/**
 * @route   GET /api/athletes/:id/stats
 * @desc    Get athlete statistics
 * @access  Private
 */
router.get(
  '/:id/stats',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid athlete ID'),
  ],
  getAthleteStats
);

export default router;
