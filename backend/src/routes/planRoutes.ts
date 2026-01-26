import express from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/generate', authenticate, generatePlan);

/**
 * @route   PUT /api/plans/:planId/adapt
 * @desc    Adapt an existing plan based on recent performance
 * @access  Private
 */
router.put('/:planId/adapt', authenticate, adaptPlan);

/**
 * @route   GET /api/plans/athlete/:athleteId/active
 * @desc    Get athlete's active training plan
 * @access  Private
 */
router.get('/athlete/:athleteId/active', authenticate, getActivePlan);

/**
 * @route   PUT /api/plans/workout/:workoutId/complete
 * @desc    Mark a workout as completed
 * @access  Private
 */
router.put('/workout/:workoutId/complete', authenticate, completeWorkout);

export default router;
