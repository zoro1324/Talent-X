import { Response } from 'express';
import { Op } from 'sequelize';
import { Athlete, TestResult } from '../models';
import { AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';

/**
 * Create a new athlete profile
 * POST /api/athletes
 */
export const createAthlete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { firstName, lastName, dateOfBirth, gender, height, weight, sport, notes } = req.body;

    const athlete = await Athlete.create({
      userId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      height,
      weight,
      sport,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Athlete profile created successfully',
      data: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        dateOfBirth: athlete.dateOfBirth,
        gender: athlete.gender,
        height: athlete.height,
        weight: athlete.weight,
        sport: athlete.sport,
        age: athlete.getAge(),
        createdAt: athlete.createdAt,
      },
    });
  } catch (error) {
    console.error('Create athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create athlete profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all athletes for current user
 * GET /api/athletes
 */
export const getAthletes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { page = 1, limit = 10, search, isActive = 'true' } = req.query;

    const whereClause: any = { 
      userId, 
      isActive: isActive === 'true' 
    };

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { sport: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: athletes } = await Athlete.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      offset,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      data: {
        athletes: athletes.map((athlete) => ({
          id: athlete.id,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          dateOfBirth: athlete.dateOfBirth,
          gender: athlete.gender,
          height: athlete.height,
          weight: athlete.weight,
          sport: athlete.sport,
          age: athlete.getAge(),
          isActive: athlete.isActive,
          createdAt: athlete.createdAt,
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
    console.error('Get athletes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athletes',
    });
  }
};

/**
 * Get single athlete by ID
 * GET /api/athletes/:id
 */
export const getAthlete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;

    const athlete = await Athlete.findOne({
      where: { id: parseInt(id, 10), userId },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        dateOfBirth: athlete.dateOfBirth,
        gender: athlete.gender,
        height: athlete.height,
        weight: athlete.weight,
        sport: athlete.sport,
        notes: athlete.notes,
        age: athlete.getAge(),
        isActive: athlete.isActive,
        createdAt: athlete.createdAt,
        updatedAt: athlete.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athlete',
    });
  }
};

/**
 * Update athlete profile
 * PUT /api/athletes/:id
 */
export const updateAthlete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;
    const { firstName, lastName, dateOfBirth, gender, height, weight, sport, notes } = req.body;

    const athlete = await Athlete.findOne({
      where: { id: parseInt(id, 10), userId },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found',
      });
      return;
    }

    // Update fields
    if (firstName) athlete.firstName = firstName;
    if (lastName) athlete.lastName = lastName;
    if (dateOfBirth) athlete.dateOfBirth = new Date(dateOfBirth);
    if (gender) athlete.gender = gender;
    if (height !== undefined) athlete.height = height;
    if (weight !== undefined) athlete.weight = weight;
    if (sport !== undefined) athlete.sport = sport;
    if (notes !== undefined) athlete.notes = notes;

    await athlete.save();

    res.status(200).json({
      success: true,
      message: 'Athlete profile updated successfully',
      data: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        dateOfBirth: athlete.dateOfBirth,
        gender: athlete.gender,
        height: athlete.height,
        weight: athlete.weight,
        sport: athlete.sport,
        notes: athlete.notes,
        age: athlete.getAge(),
        updatedAt: athlete.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update athlete profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Soft delete athlete (set isActive to false)
 * DELETE /api/athletes/:id
 */
export const deleteAthlete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;

    const athlete = await Athlete.findOne({
      where: { id: parseInt(id, 10), userId },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found',
      });
      return;
    }

    athlete.isActive = false;
    await athlete.save();

    res.status(200).json({
      success: true,
      message: 'Athlete profile deleted successfully',
    });
  } catch (error) {
    console.error('Delete athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete athlete profile',
    });
  }
};

/**
 * Restore soft-deleted athlete
 * PATCH /api/athletes/:id/restore
 */
export const restoreAthlete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;

    const athlete = await Athlete.findOne({
      where: { id: parseInt(id, 10), userId, isActive: false },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found or already active',
      });
      return;
    }

    athlete.isActive = true;
    await athlete.save();

    res.status(200).json({
      success: true,
      message: 'Athlete profile restored successfully',
      data: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        isActive: athlete.isActive,
      },
    });
  } catch (error) {
    console.error('Restore athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore athlete profile',
    });
  }
};

/**
 * Get athlete statistics
 * GET /api/athletes/:id/stats
 */
export const getAthleteStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { id } = req.params;

    const athlete = await Athlete.findOne({
      where: { id: parseInt(id, 10), userId },
    });

    if (!athlete) {
      res.status(404).json({
        success: false,
        message: 'Athlete not found',
      });
      return;
    }

    // Get test statistics using raw query for aggregation
    const stats = await TestResult.findAll({
      where: { athleteId: parseInt(id, 10), isValid: true },
      attributes: [
        'testType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTests'],
        [sequelize.fn('AVG', sequelize.col('average_form_score')), 'avgFormScore'],
        [sequelize.fn('SUM', sequelize.col('total_reps')), 'totalReps'],
        [sequelize.fn('MAX', sequelize.col('created_at')), 'lastTest'],
      ],
      group: ['testType'],
      raw: true,
    }) as any[];

    const totalTests = stats.reduce((sum: number, s: any) => sum + parseInt(s.totalTests, 10), 0);

    res.status(200).json({
      success: true,
      data: {
        athlete: {
          id: athlete.id,
          name: athlete.getFullName(),
          age: athlete.getAge(),
        },
        summary: {
          totalTests,
          testTypes: stats.length,
        },
        byTestType: stats.map((s: any) => ({
          testType: s.testType,
          totalTests: parseInt(s.totalTests, 10),
          averageFormScore: Math.round(parseFloat(s.avgFormScore || 0) * 100) / 100,
          totalReps: parseInt(s.totalReps || 0, 10),
          lastTest: s.lastTest,
        })),
      },
    });
  } catch (error) {
    console.error('Get athlete stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athlete statistics',
    });
  }
};
