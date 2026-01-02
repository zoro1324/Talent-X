import express from 'express';
import { getDashboardStats, getAchievements } from '../controllers/dashboardController';

const router = express.Router();

// Dashboard routes (public - no authentication required)
router.get('/stats', getDashboardStats);
router.get('/achievements', getAchievements);

export default router;
