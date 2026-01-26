import { Request, Response } from 'express';
import TrainingPlan, { IPerformanceSnapshot } from '../models/TrainingPlan';
import PlanWorkout, { IWorkoutExercise } from '../models/PlanWorkout';
import TestResult from '../models/TestResult';
import Athlete from '../models/Athlete';
import { Op } from 'sequelize';

// Extend Express Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * Generate a personalized training plan for an athlete
 */
export const generatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { athleteId, sport, difficulty, weeklyVolume, userAvailability } = req.body;

    // Verify athlete exists and belongs to user
    const athlete = await Athlete.findOne({
      where: {
        id: athleteId,
        userId: req.user!.id,
      },
    });

    if (!athlete) {
      res.status(404).json({ message: 'Athlete not found' });
      return;
    }

    // Deactivate any existing active plans
    await TrainingPlan.update(
      { isActive: false },
      {
        where: {
          athleteId,
          isActive: true,
        },
      }
    );

    // Determine initial intensity based on difficulty
    const intensityMap = {
      beginner: 4,
      intermediate: 6,
      advanced: 8,
      elite: 9,
    };

    const weeklyIntensity = intensityMap[difficulty as keyof typeof intensityMap] || 5;

    // Create the training plan
    const plan = await TrainingPlan.create({
      athleteId,
      sport,
      difficulty,
      weeklyVolume: weeklyVolume || 180, // Default 3 hours per week
      weeklyIntensity,
      startDate: new Date(),
      isActive: true,
      performanceHistory: [],
    });

    // Generate initial 4 weeks of workouts
    await generateWorkouts(plan.id, sport, difficulty, weeklyVolume || 180, weeklyIntensity, userAvailability);

    // Fetch the complete plan with workouts
    const completePlan = await TrainingPlan.findByPk(plan.id, {
      include: [
        {
          model: PlanWorkout,
          as: 'workouts',
        },
      ],
    });

    res.status(201).json({
      message: 'Training plan generated successfully',
      plan: completePlan,
    });
  } catch (error: any) {
    console.error('Generate plan error:', error);
    res.status(500).json({ message: 'Failed to generate training plan', error: error.message });
  }
};

/**
 * Generate workouts for a training plan
 */
async function generateWorkouts(
  planId: number,
  sport: string,
  difficulty: string,
  weeklyVolume: number,
  intensity: number,
  userAvailability?: number[] // Days of week available (1-7)
): Promise<void> {
  const availableDays = userAvailability || [1, 3, 5]; // Default: Mon, Wed, Fri
  const sessionsPerWeek = availableDays.length;
  const durationPerSession = Math.floor(weeklyVolume / sessionsPerWeek);

  // Sport-specific workout templates
  const workoutTemplates = getWorkoutTemplates(sport, difficulty);

  // Generate 4 weeks of workouts
  for (let week = 1; week <= 4; week++) {
    for (let dayIndex = 0; dayIndex < sessionsPerWeek; dayIndex++) {
      const dayNumber = availableDays[dayIndex];
      const template = workoutTemplates[dayIndex % workoutTemplates.length];

      await PlanWorkout.create({
        planId,
        weekNumber: week,
        dayNumber,
        workoutType: template.type,
        title: `Week ${week} - ${template.title}`,
        description: template.description,
        exercises: template.exercises,
        estimatedDuration: durationPerSession,
        completed: false,
      });
    }
  }
}

/**
 * Get sport-specific workout templates
 */
function getWorkoutTemplates(sport: string, difficulty: string) {
  // Generic fitness templates (can be customized per sport)
  const templates = [
    {
      type: 'strength' as const,
      title: 'Strength Training',
      description: 'Build overall strength and power',
      exercises: [
        { name: 'Squats', sets: 3, reps: 12, intensity: 'moderate' },
        { name: 'Push-ups', sets: 3, reps: 15, intensity: 'moderate' },
        { name: 'Pull-ups', sets: 3, reps: 8, intensity: 'high' },
        { name: 'Plank Hold', duration: 60, intensity: 'moderate' },
        { name: 'Lunges', sets: 3, reps: 10, intensity: 'moderate' },
      ],
    },
    {
      type: 'cardio' as const,
      title: 'Cardio & Endurance',
      description: 'Improve cardiovascular fitness',
      exercises: [
        { name: 'Running', duration: 1200, intensity: 'moderate', notes: '20 min steady pace' },
        { name: 'Jump Rope', duration: 300, intensity: 'high', notes: '5 min intervals' },
        { name: 'Burpees', sets: 3, reps: 15, intensity: 'high' },
        { name: 'Mountain Climbers', sets: 3, duration: 45, intensity: 'high' },
      ],
    },
    {
      type: 'skill' as const,
      title: 'Sport-Specific Skills',
      description: `${sport} technique and skill development`,
      exercises: [
        { name: 'Agility Drills', duration: 600, intensity: 'moderate' },
        { name: 'Coordination Exercises', duration: 600, intensity: 'moderate' },
        { name: 'Sport-Specific Movements', duration: 600, intensity: 'moderate' },
      ],
    },
  ];

  return templates;
}

/**
 * Adapt an existing training plan based on recent performance
 */
export const adaptPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await TrainingPlan.findByPk(planId, {
      include: [
        {
          model: Athlete,
          as: 'athlete',
          where: { userId: req.user!.id },
        },
      ],
    });

    if (!plan) {
      res.status(404).json({ message: 'Training plan not found' });
      return;
    }

    // Get recent test results (last 30 days)
    const recentResults = await TestResult.findAll({
      where: {
        athleteId: plan.athleteId,
        completedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      order: [['completedAt', 'DESC']],
      limit: 10,
    });

    if (recentResults.length < 2) {
      res.status(400).json({ message: 'Not enough data to adapt plan. Need at least 2 recent test results.' });
      return;
    }

    // Analyze performance trends
    const trends = analyzePerformanceTrends(recentResults, plan.performanceHistory);

    // Adjust plan based on trends
    let { weeklyVolume, weeklyIntensity } = plan;

    if (trends.overallTrend === 'improving') {
      // Increase intensity slightly (max 20% increase)
      weeklyIntensity = Math.min(10, weeklyIntensity * 1.1);
      weeklyVolume = Math.min(weeklyVolume * 1.1, 1200);
    } else if (trends.overallTrend === 'declining') {
      // Decrease intensity/volume (allow recovery)
      weeklyIntensity = Math.max(1, weeklyIntensity * 0.9);
      weeklyVolume = Math.max(60, weeklyVolume * 0.9);
    }

    // Update plan
    await plan.update({
      weeklyVolume: Math.round(weeklyVolume),
      weeklyIntensity: Math.round(weeklyIntensity * 10) / 10,
      lastAdaptedAt: new Date(),
      performanceHistory: [...plan.performanceHistory, ...trends.newSnapshots],
    });

    res.json({
      message: 'Plan adapted successfully',
      plan,
      adaptationSummary: {
        trend: trends.overallTrend,
        volumeChange: Math.round(((weeklyVolume - plan.weeklyVolume) / plan.weeklyVolume) * 100),
        intensityChange: Math.round(((weeklyIntensity - plan.weeklyIntensity) / plan.weeklyIntensity) * 100),
      },
    });
  } catch (error: any) {
    console.error('Adapt plan error:', error);
    res.status(500).json({ message: 'Failed to adapt training plan', error: error.message });
  }
};

/**
 * Analyze performance trends from test results
 */
function analyzePerformanceTrends(
  recentResults: any[],
  existingHistory: IPerformanceSnapshot[]
): {
  overallTrend: 'improving' | 'stable' | 'declining';
  newSnapshots: IPerformanceSnapshot[];
} {
  const newSnapshots: IPerformanceSnapshot[] = [];

  // Group by test type
  const byType: Record<string, any[]> = {};
  recentResults.forEach((result) => {
    if (!byType[result.testType]) {
      byType[result.testType] = [];
    }
    byType[result.testType].push(result);
  });

  let improvingCount = 0;
  let decliningCount = 0;

  // Analyze each test type
  Object.entries(byType).forEach(([testType, results]) => {
    if (results.length < 2) return;

    const sorted = results.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    const latestScore = latest.score.standardizedScore;
    const previousScore = previous.score.standardizedScore;
    const percentChange = ((latestScore - previousScore) / previousScore) * 100;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (percentChange > 5) {
      trend = 'improving';
      improvingCount++;
    } else if (percentChange < -5) {
      trend = 'declining';
      decliningCount++;
    }

    newSnapshots.push({
      date: latest.completedAt.toISOString(),
      testType,
      score: latestScore,
      percentile: latest.score.percentile || 50,
      trend,
    });
  });

  // Determine overall trend
  let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (improvingCount > decliningCount) {
    overallTrend = 'improving';
  } else if (decliningCount > improvingCount) {
    overallTrend = 'declining';
  }

  return { overallTrend, newSnapshots };
}

/**
 * Get athlete's active training plan
 */
export const getActivePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { athleteId } = req.params;

    // Verify athlete belongs to user
    const athlete = await Athlete.findOne({
      where: {
        id: athleteId,
        userId: req.user!.id,
      },
    });

    if (!athlete) {
      res.status(404).json({ message: 'Athlete not found' });
      return;
    }

    const plan = await TrainingPlan.findOne({
      where: {
        athleteId,
        isActive: true,
      },
      include: [
        {
          model: PlanWorkout,
          as: 'workouts',
        },
      ],
      order: [[
        { model: PlanWorkout, as: 'workouts' },
        'weekNumber',
        'ASC'
      ], [
        { model: PlanWorkout, as: 'workouts' },
        'dayNumber',
        'ASC'
      ]],
    });

    if (!plan) {
      res.status(404).json({ message: 'No active training plan found' });
      return;
    }

    res.json({ plan });
  } catch (error: any) {
    console.error('Get active plan error:', error);
    res.status(500).json({ message: 'Failed to fetch training plan', error: error.message });
  }
};

/**
 * Mark a workout as completed
 */
export const completeWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workoutId } = req.params;

    const workout = await PlanWorkout.findByPk(workoutId, {
      include: [
        {
          model: TrainingPlan,
          as: 'plan',
          include: [
            {
              model: Athlete,
              as: 'athlete',
              where: { userId: req.user!.id },
            },
          ],
        },
      ],
    });

    if (!workout) {
      res.status(404).json({ message: 'Workout not found' });
      return;
    }

    await workout.update({
      completed: true,
      completedAt: new Date(),
    });

    res.json({ message: 'Workout marked as completed', workout });
  } catch (error: any) {
    console.error('Complete workout error:', error);
    res.status(500).json({ message: 'Failed to complete workout', error: error.message });
  }
};
