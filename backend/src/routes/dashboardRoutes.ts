import express from 'express';
import { getDashboardStats, getAchievements, getLeaderboard } from '../controllers/dashboardController';

const router = express.Router();

// Dashboard routes (public - no authentication required)
router.get('/stats', getDashboardStats);
router.get('/achievements', getAchievements);
router.get('/leaderboard', getLeaderboard);

export default router;
