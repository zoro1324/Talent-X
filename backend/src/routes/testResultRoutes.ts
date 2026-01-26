import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTestResult,
  getTestResults,
  getTestResult,
  deleteTestResult,
  getAthleteTestHistory,
  getLeaderboard,
  getTestStatsSummary,
} from '../controllers/testResultController';
import { authenticate } from '../middleware/auth';
import { apiLimiter, testSubmitLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/tests
 * @desc    Create a new test result
 * @access  Private
 */
router.post(
  '/',
  testSubmitLimiter,
  [
    body('athleteId')
      .isMongoId()
      .withMessage('Invalid athlete ID'),
    body('testType')
      .isIn([
        'squats',
        'pushups',
        'jump',
        'situps',
        'pullups',
        'running',
        'plank',
        'wall_sit',
        'burpees',
        'lunges',
        'mountain_climbers',
        'broad_jump',
        'single_leg_balance',
        'lateral_hops',
        'hand_release_pushups',
        'shuttle_run',
      ])
      .withMessage('Invalid test type'),
    body('startedAt')
      .isISO8601()
      .withMessage('Valid start time is required'),
    body('completedAt')
      .isISO8601()
      .withMessage('Valid completion time is required'),
    body('duration')
      .isInt({ min: 1 })
      .withMessage('Duration must be at least 1 second'),
    body('repetitions')
      .isArray()
      .withMessage('Repetitions must be an array'),
    body('repetitions.*.startTime')
      .isNumeric()
      .withMessage('Repetition start time must be a number'),
    body('repetitions.*.endTime')
      .isNumeric()
      .withMessage('Repetition end time must be a number'),
    body('repetitions.*.duration')
      .isNumeric()
      .withMessage('Repetition duration must be a number'),
    body('repetitions.*.formScore')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Form score must be between 0 and 100'),
    body('repetitions.*.issues')
      .isArray()
      .withMessage('Issues must be an array'),
    body('totalReps')
      .isInt({ min: 0 })
      .withMessage('Total reps must be a non-negative integer'),
    body('score')
      .isObject()
      .withMessage('Score must be an object'),
    body('score.rawScore')
      .isNumeric()
      .withMessage('Raw score must be a number'),
    body('score.standardizedScore')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Standardized score must be between 0 and 100'),
    body('score.percentile')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Percentile must be between 0 and 100'),
    body('score.grade')
      .isIn(['A', 'B', 'C', 'D', 'F'])
      .withMessage('Grade must be A, B, C, D, or F'),
    body('score.feedback')
      .isArray()
      .withMessage('Feedback must be an array'),
    body('averageFormScore')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Average form score must be between 0 and 100'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('videoUrl')
      .optional()
      .isURL()
      .withMessage('Video URL must be a valid URL'),
  ],
  createTestResult
);

/**
 * @route   GET /api/tests
 * @desc    Get all test results for current user
 * @access  Private
 */
router.get(
  '/',
  apiLimiter,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('athleteId')
      .optional()
      .isMongoId()
      .withMessage('Invalid athlete ID'),
    query('testType')
      .optional()
      .isIn([
        'squats',
        'pushups',
        'jump',
        'situps',
        'pullups',
        'running',
        'plank',
        'wall_sit',
        'burpees',
        'lunges',
        'mountain_climbers',
        'broad_jump',
        'single_leg_balance',
        'lateral_hops',
        'hand_release_pushups',
        'shuttle_run',
      ])
      .withMessage('Invalid test type'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'score.standardizedScore', 'totalReps', 'averageFormScore'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],
  getTestResults
);

/**
 * @route   GET /api/tests/stats/summary
 * @desc    Get test statistics summary
 * @access  Private
 */
router.get('/stats/summary', apiLimiter, getTestStatsSummary);

/**
 * @route   GET /api/tests/leaderboard/:testType
 * @desc    Get leaderboard by test type
 * @access  Private
 */
router.get(
  '/leaderboard/:testType',
  apiLimiter,
  [
    param('testType')
      .isIn([
        'squats',
        'pushups',
        'jump',
        'situps',
        'pullups',
        'running',
        'plank',
        'wall_sit',
        'burpees',
        'lunges',
        'mountain_climbers',
        'broad_jump',
        'single_leg_balance',
        'lateral_hops',
        'hand_release_pushups',
        'shuttle_run',
      ])
      .withMessage('Invalid test type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  getLeaderboard
);

/**
 * @route   GET /api/tests/athlete/:athleteId/history
 * @desc    Get test history for an athlete
 * @access  Private
 */
router.get(
  '/athlete/:athleteId/history',
  apiLimiter,
  [
    param('athleteId')
      .isMongoId()
      .withMessage('Invalid athlete ID'),
    query('testType')
      .optional()
      .isIn([
        'squats',
        'pushups',
        'jump',
        'situps',
        'pullups',
        'running',
        'plank',
        'wall_sit',
        'burpees',
        'lunges',
        'mountain_climbers',
        'broad_jump',
        'single_leg_balance',
        'lateral_hops',
        'hand_release_pushups',
        'shuttle_run',
      ])
      .withMessage('Invalid test type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  getAthleteTestHistory
);

/**
 * @route   GET /api/tests/:id
 * @desc    Get single test result by ID
 * @access  Private
 */
router.get(
  '/:id',
  apiLimiter,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid test result ID'),
  ],
  getTestResult
);

/**
 * @route   DELETE /api/tests/:id
 * @desc    Delete test result (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  apiLimiter,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid test result ID'),
  ],
  deleteTestResult
);

export default router;
