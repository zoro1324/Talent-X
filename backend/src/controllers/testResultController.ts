import { Response } from 'express';
import { Op } from 'sequelize';
import { TestResult, Athlete } from '../models';
import { AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';

/**
 * Create a new test result
 * POST /api/tests
 */
export const createTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const {
      athleteId,
      testType,
      startedAt,
      completedAt,
      duration,
      repetitions,
      totalReps,
      score,
      averageFormScore,
      notes,
      videoUrl,
    } = req.body;

    // Verify athlete exists and belongs to user
    const athlete = await Athlete.findOne({
      where: { id: parseInt(athleteId, 10), userId },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found',
      });
      return;
    }

    const testResult = await TestResult.create({
      athleteId: parseInt(athleteId, 10),
      userId,
      testType,
      startedAt: new Date(startedAt),
      completedAt: new Date(completedAt),
      duration,
      repetitions,
      totalReps,
      score,
      averageFormScore,
      notes,
      videoUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Test result saved successfully',
      data: {
        id: testResult.id,
        athleteId: testResult.athleteId,
        testType: testResult.testType,
        totalReps: testResult.totalReps,
        score: testResult.score,
        averageFormScore: testResult.averageFormScore,
        duration: testResult.duration,
        createdAt: testResult.createdAt,
      },
    });
  } catch (error) {
    console.error('Create test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save test result',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all test results for current user
 * GET /api/tests
 */
export const getTestResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const {
      page = 1,
      limit = 10,
      athleteId,
      testType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const whereClause: any = { userId, isValid: true };

    if (athleteId) {
      whereClause.athleteId = parseInt(athleteId as string, 10);
    }

    if (testType) {
      whereClause.testType = testType;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Map sortBy to actual column name (Sequelize uses snake_case in DB)
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy as string;

    const { count, rows: testResults } = await TestResult.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Athlete,
          as: 'athlete',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [[sortColumn, sortOrder === 'asc' ? 'ASC' : 'DESC']],
      offset,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      data: {
        testResults: testResults.map((result) => ({
          id: result.id,
          athlete: (result as any).athlete,
          testType: result.testType,
          totalReps: result.totalReps,
          score: result.score,
          averageFormScore: result.averageFormScore,
          duration: result.duration,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          createdAt: result.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          pages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test results',
    });
  }
};

/**
 * Get single test result by ID
 * GET /api/tests/:id
 */
export const getTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;

    const testResult = await TestResult.findOne({
      where: { id: parseInt(id, 10), userId },
      include: [
        {
          model: Athlete,
          as: 'athlete',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender'],
        },
      ],
    });

    if (!testResult) {
      res.status(404).json({
        success: false,
        message: 'Test result not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: testResult.id,
        athlete: (testResult as any).athlete,
        testType: testResult.testType,
        startedAt: testResult.startedAt,
        completedAt: testResult.completedAt,
        duration: testResult.duration,
        repetitions: testResult.repetitions,
        totalReps: testResult.totalReps,
        score: testResult.score,
        averageFormScore: testResult.averageFormScore,
        notes: testResult.notes,
        videoUrl: testResult.videoUrl,
        isValid: testResult.isValid,
        createdAt: testResult.createdAt,
      },
    });
  } catch (error) {
    console.error('Get test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test result',
    });
  }
};

/**
 * Delete test result (soft delete)
 * DELETE /api/tests/:id
 */
export const deleteTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;

    const testResult = await TestResult.findOne({
      where: { id: parseInt(id, 10), userId },
    });

    if (!testResult) {
      res.status(404).json({
        success: false,
        message: 'Test result not found',
      });
      return;
    }

    testResult.isValid = false;
    await testResult.save();

    res.status(200).json({
      success: true,
      message: 'Test result deleted successfully',
    });
  } catch (error) {
    console.error('Delete test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test result',
    });
  }
};

/**
 * Get test history for an athlete
 * GET /api/tests/athlete/:athleteId/history
 */
export const getAthleteTestHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { athleteId } = req.params;
    const { testType, limit = 10 } = req.query;

    // Verify athlete belongs to user
    const athlete = await Athlete.findOne({
      where: { id: parseInt(athleteId, 10), userId },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found',
      });
      return;
    }

    const whereClause: any = {
      athleteId: parseInt(athleteId, 10),
      userId,
      isValid: true,
    };
    if (testType) {
      whereClause.testType = testType;
    }

    const testResults = await TestResult.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit as string, 10),
      attributes: ['id', 'testType', 'totalReps', 'score', 'averageFormScore', 'duration', 'createdAt'],
    });

    res.status(200).json({
      success: true,
      data: {
        athlete: {
          id: athlete.id,
          name: athlete.getFullName(),
        },
        testResults: testResults.map((result) => ({
          id: result.id,
          testType: result.testType,
          totalReps: result.totalReps,
          score: result.score,
          averageFormScore: result.averageFormScore,
          duration: result.duration,
          createdAt: result.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get athlete test history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test history',
    });
  }
};

/**
 * Get leaderboard by test type
 * GET /api/tests/leaderboard/:testType
 */
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testType } = req.params;
    const { limit = 10 } = req.query;

    if (!['squats', 'pushups', 'jump'].includes(testType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid test type. Must be squats, pushups, or jump.',
      });
      return;
    }

    // Use raw query for complex leaderboard aggregation
    const [results] = await sequelize.query(`
      SELECT 
        tr.athlete_id as athleteId,
        CONCAT(a.first_name, ' ', a.last_name) as athleteName,
        tr.test_type as testType,
        tr.score,
        tr.total_reps as totalReps,
        tr.average_form_score as averageFormScore,
        tr.created_at as date
      FROM test_results tr
      INNER JOIN (
        SELECT athlete_id, MAX(average_form_score) as max_score
        FROM test_results
        WHERE test_type = :testType AND is_valid = true
        GROUP BY athlete_id
      ) best ON tr.athlete_id = best.athlete_id AND tr.average_form_score = best.max_score
      INNER JOIN athletes a ON tr.athlete_id = a.id
      WHERE tr.test_type = :testType AND tr.is_valid = true
      ORDER BY tr.average_form_score DESC
      LIMIT :limit
    `, {
      replacements: { testType, limit: parseInt(limit as string, 10) },
    });

    // Add rank numbers
    const rankedLeaderboard = (results as any[]).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    res.status(200).json({
      success: true,
      data: {
        testType,
        leaderboard: rankedLeaderboard,
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
    });
  }
};

/**
 * Get test statistics summary
 * GET /api/tests/stats/summary
 */
export const getTestStatsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);

    const stats = await TestResult.findAll({
      where: { userId, isValid: true },
      attributes: [
        'testType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTests'],
        [sequelize.fn('AVG', sequelize.col('average_form_score')), 'avgFormScore'],
        [sequelize.fn('MAX', sequelize.col('average_form_score')), 'bestScore'],
        [sequelize.fn('SUM', sequelize.col('total_reps')), 'totalReps'],
        [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
      ],
      group: ['testType'],
      raw: true,
    }) as any[];

    const totalTests = stats.reduce((sum: number, s: any) => sum + parseInt(s.totalTests, 10), 0);
    const totalReps = stats.reduce((sum: number, s: any) => sum + parseInt(s.totalReps || 0, 10), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTests,
          totalReps,
          testTypes: stats.length,
        },
        byTestType: stats.map((s: any) => ({
          testType: s.testType,
          totalTests: parseInt(s.totalTests, 10),
          averageFormScore: Math.round(parseFloat(s.avgFormScore || 0) * 100) / 100,
          bestScore: parseFloat(s.bestScore || 0),
          totalReps: parseInt(s.totalReps || 0, 10),
          averageDuration: Math.round(parseFloat(s.avgDuration || 0)),
        })),
      },
    });
  } catch (error) {
    console.error('Get test stats summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test statistics',
    });
  }
};
