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

/**
 * Get segmented leaderboard
 * @route GET /api/dashboard/leaderboard
 * @query sport - Filter by sport
 * @query ageGroup - Filter by age group (U12, U14, U16, U18, U20, adult)
 * @query school - Filter by school
 * @query club - Filter by club
 * @query testType - Filter by test type
 * @query limit - Number of results (default 10)
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sport, ageGroup, school, club, testType, limit = '10' } = req.query;
    const resultLimit = parseInt(limit as string) || 10;

    // Build athlete filter conditions
    const athleteWhere: any = { isActive: true };
    
    if (sport) {
      athleteWhere.sport = sport;
    }
    if (school) {
      athleteWhere.school = school;
    }
    if (club) {
      athleteWhere.club = club;
    }

    // Age group filtering
    if (ageGroup) {
      const today = new Date();
      let minAge = 0;
      let maxAge = 100;

      switch (ageGroup) {
        case 'U12':
          maxAge = 12;
          break;
        case 'U14':
          minAge = 12;
          maxAge = 14;
          break;
        case 'U16':
          minAge = 14;
          maxAge = 16;
          break;
        case 'U18':
          minAge = 16;
          maxAge = 18;
          break;
        case 'U20':
          minAge = 18;
          maxAge = 20;
          break;
        case 'adult':
          minAge = 20;
          break;
      }

      // Calculate date range for age filtering
      const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());

      if (maxAge < 100) {
        athleteWhere.dateOfBirth = {
          [Op.between]: [minDate, maxDate],
        };
      } else {
        athleteWhere.dateOfBirth = {
          [Op.lte]: maxDate,
        };
      }
    }

    // Get athletes matching filters
    const athletes = await Athlete.findAll({
      where: athleteWhere,
      attributes: ['id', 'firstName', 'lastName', 'sport', 'school', 'club', 'dateOfBirth'],
    });

    if (athletes.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        filters: { sport, ageGroup, school, club, testType },
      });
      return;
    }

    const athleteIds = athletes.map(a => a.id);

    // Build test result filter
    const testWhere: any = {
      athleteId: { [Op.in]: athleteIds },
      isValid: true,
    };

    if (testType) {
      testWhere.testType = testType;
    }

    // Get test results for filtered athletes
    const testResults = await TestResult.findAll({
      where: testWhere,
      attributes: ['athleteId', 'testType', 'score', 'averageFormScore', 'totalReps', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
    }) as any[];

    if (testResults.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        filters: { sport, ageGroup, school, club, testType },
      });
      return;
    }

    // Calculate best score per athlete
    const athleteStats = new Map<number, {
      bestScore: number;
      bestTest: string;
      totalTests: number;
      avgFormScore: number;
      latestDate: Date;
    }>();

    testResults.forEach((result) => {
      const score = typeof result.score === 'string' ? JSON.parse(result.score) : result.score;
      const standardizedScore = score?.standardizedScore || score?.overall || 0;
      
      const current = athleteStats.get(result.athleteId);
      if (!current || standardizedScore > current.bestScore) {
        athleteStats.set(result.athleteId, {
          bestScore: standardizedScore,
          bestTest: result.testType,
          totalTests: (current?.totalTests || 0) + 1,
          avgFormScore: result.averageFormScore || 0,
          latestDate: new Date(result.createdAt),
        });
      } else {
        current.totalTests++;
      }
    });

    // Create leaderboard entries
    const leaderboardEntries = athletes
      .map(athlete => {
        const stats = athleteStats.get(athlete.id);
        if (!stats) return null;

        const age = calculateAge(athlete.dateOfBirth);

        return {
          rank: 0, // Will be set after sorting
          athlete: {
            id: athlete.id,
            name: `${athlete.firstName} ${athlete.lastName}`,
            sport: athlete.sport || 'General',
            school: athlete.school,
            club: athlete.club,
            age,
          },
          score: Math.round(stats.bestScore),
          testType: stats.bestTest,
          formScore: Math.round(stats.avgFormScore),
          totalTests: stats.totalTests,
          lastUpdated: stats.latestDate.toISOString(),
        };
      })
      .filter(entry => entry !== null)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, resultLimit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    res.status(200).json({
      success: true,
      data: leaderboardEntries,
      filters: { sport, ageGroup, school, club, testType },
      totalEntries: leaderboardEntries.length,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
