import { Request, Response } from 'express';
import { Athlete, TestResult, Sport, Exercise } from '../models';
import { Op, fn, col, literal } from 'sequelize';

/**
 * Get dashboard statistics
 * @route GET /api/dashboard/stats
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total active athletes
    const totalAthletes = await Athlete.count({
      where: { isActive: true },
    });

    // Get total active sports
    const totalSports = await Sport.count({
      where: { isActive: true },
    });

    // Get tests today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const testsToday = await TestResult.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // Get average score (all time)
    const allTests = await TestResult.findAll({
      attributes: ['score'],
      raw: true,
    }) as any[];

    let avgScore = '0.0';
    if (allTests.length > 0) {
      const totalScore = allTests.reduce((sum, test) => {
        const score = typeof test.score === 'string' ? JSON.parse(test.score) : test.score;
        return sum + (score?.overall || 0);
      }, 0);
      avgScore = (totalScore / allTests.length).toFixed(1);
    }

    // Get previous period stats for trends
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const testsYesterday = await TestResult.count({
      where: {
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today,
        },
      },
    });

    const testsTrend = testsYesterday > 0 
      ? `${((testsToday - testsYesterday) / testsYesterday * 100).toFixed(0)}%`
      : '+0%';

    res.status(200).json({
      success: true,
      data: {
        totalAthletes: totalAthletes.toString(),
        testsToday: testsToday.toString(),
        activeSports: totalSports.toString(),
        avgScore: avgScore,
        trends: {
          athletes: '+12%', // Can be calculated based on previous period
          tests: testsTrend,
          sports: '',
          score: '+3%', // Can be calculated based on previous period
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get top performing athletes (achievements)
 * @route GET /api/dashboard/achievements
 */
export const getAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 3;

    // Get all test results with athlete info
    const testResults = await TestResult.findAll({
      attributes: ['athleteId', 'score', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 100, // Get recent tests
      raw: true,
    }) as any[];

    // If no test results, return empty array
    if (testResults.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
      });
      return;
    }

    // Calculate max score per athlete
    const athleteScores = new Map<number, number>();
    testResults.forEach((result) => {
      const score = typeof result.score === 'string' ? JSON.parse(result.score) : result.score;
      const overallScore = score?.overall || 0;
      
      const currentMax = athleteScores.get(result.athleteId) || 0;
      if (overallScore > currentMax) {
        athleteScores.set(result.athleteId, overallScore);
      }
    });

    // Sort by score and get top performers
    const topAthleteIds = Array.from(athleteScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([athleteId]) => athleteId);

    // Get athlete details for top performers
    const achievements = await Promise.all(
      topAthleteIds.map(async (athleteId, index) => {
        const athlete = await Athlete.findByPk(athleteId);
        if (!athlete || !athlete.isActive) return null;

        const title = index === 0 ? 'Top Performer' : 
                      index === 1 ? 'Most Improved' : 
                      'Rising Star';

        return {
          id: athlete.id.toString(),
          title,
          athlete: `${athlete.firstName} ${athlete.lastName}`,
          sport: athlete.sport || 'General',
          score: Math.round(athleteScores.get(athleteId) || 0),
        };
      })
    );

    // Filter out null results
    const validAchievements = achievements.filter(a => a !== null);

    res.status(200).json({
      success: true,
      data: validAchievements,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
