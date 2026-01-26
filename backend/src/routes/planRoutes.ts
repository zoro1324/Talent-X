import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  generatePlan,
  adaptPlan,
  getActivePlan,
  completeWorkout,
} from '../controllers/planController';

const router = express.Router();

/**
 * @route   POST /api/plans/generate
 * @desc    Generate a new training plan for an athlete
 * @access  Private
 */
router.post('/generate', authenticateToken, generatePlan);

/**
 * @route   PUT /api/plans/:planId/adapt
 * @desc    Adapt an existing plan based on recent performance
 * @access  Private
 */
router.put('/:planId/adapt', authenticateToken, adaptPlan);

/**
 * @route   GET /api/plans/athlete/:athleteId/active
 * @desc    Get athlete's active training plan
 * @access  Private
 */
router.get('/athlete/:athleteId/active', authenticateToken, getActivePlan);

/**
 * @route   PUT /api/plans/workout/:workoutId/complete
 * @desc    Mark a workout as completed
 * @access  Private
 */
router.put('/workout/:workoutId/complete', authenticateToken, completeWorkout);

export default router;
