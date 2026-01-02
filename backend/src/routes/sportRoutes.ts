import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getSports,
  getSport,
  getSportExercises,
  createSport,
  createExercise,
  seedSportsData,
} from '../controllers/sportController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiter
router.use(apiLimiter);

/**
 * @route   GET /api/sports
 * @desc    Get all active sports with athlete counts
 * @access  Public
 */
router.get('/', getSports);

/**
 * @route   POST /api/sports/seed
 * @desc    Seed initial sports and exercises data
 * @access  Public (for initial setup)
 */
router.post('/seed', seedSportsData);

/**
 * @route   GET /api/sports/:id/exercises
 * @desc    Get exercises for a specific sport
 * @access  Public
 */
router.get(
  '/:id/exercises',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid sport ID'),
    query('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  ],
  getSportExercises
);

/**
 * @route   GET /api/sports/:id
 * @desc    Get a single sport by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid sport ID'),
  ],
  getSport
);

// Protected routes - require authentication
router.use(authenticate);

/**
 * @route   POST /api/sports
 * @desc    Create a new sport
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Sport name is required')
      .isLength({ max: 100 })
      .withMessage('Sport name cannot exceed 100 characters'),
    body('icon')
      .trim()
      .notEmpty()
      .withMessage('Icon is required'),
    body('colorPrimary')
      .trim()
      .notEmpty()
      .withMessage('Primary color is required')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Primary color must be a valid hex color'),
    body('colorSecondary')
      .trim()
      .notEmpty()
      .withMessage('Secondary color is required')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Secondary color must be a valid hex color'),
    body('image')
      .trim()
      .notEmpty()
      .withMessage('Image URL is required')
      .isURL()
      .withMessage('Image must be a valid URL'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
  ],
  createSport
);

/**
 * @route   POST /api/sports/:id/exercises
 * @desc    Create a new exercise for a sport
 * @access  Private
 */
router.post(
  '/:id/exercises',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid sport ID'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Exercise name is required')
      .isLength({ max: 100 })
      .withMessage('Exercise name cannot exceed 100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('icon')
      .trim()
      .notEmpty()
      .withMessage('Icon is required'),
    body('duration')
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive integer (in seconds)'),
    body('difficulty')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    body('muscleGroups')
      .isArray()
      .withMessage('Muscle groups must be an array'),
    body('equipment')
      .isArray()
      .withMessage('Equipment must be an array'),
    body('instructions')
      .isArray()
      .withMessage('Instructions must be an array'),
    body('benefits')
      .isArray()
      .withMessage('Benefits must be an array'),
    body('calories')
      .isInt({ min: 0 })
      .withMessage('Calories must be a non-negative integer'),
    body('sets')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sets must be a positive integer'),
    body('reps')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Reps must be a positive integer'),
  ],
  createExercise
);

export default router;
