import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Sport, Exercise, Athlete } from '../models';
import { Op } from 'sequelize';

/**
 * Get all active sports with athlete count
 * @route GET /api/sports
 */
export const getSports = async (req: Request, res: Response): Promise<void> => {
  try {
    const sports = await Sport.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    // Get athlete count per sport
    const sportsWithCounts = await Promise.all(
      sports.map(async (sport) => {
        const athleteCount = await Athlete.count({
          where: {
            sport: {
              [Op.like]: `%${sport.name}%`,
            },
            isActive: true,
          },
        });

        return {
          id: sport.id.toString(),
          name: sport.name,
          icon: sport.icon,
          color: [sport.colorPrimary, sport.colorSecondary],
          image: sport.image,
          description: sport.description,
          athletes: athleteCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: sportsWithCounts,
    });
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sports',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single sport by ID
 * @route GET /api/sports/:id
 */
export const getSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sport = await Sport.findByPk(id, {
      include: [
        {
          model: Exercise,
          as: 'exercises',
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!sport) {
      res.status(404).json({
        success: false,
        message: 'Sport not found',
      });
      return;
    }

    // Get athlete count for this sport
    const athleteCount = await Athlete.count({
      where: {
        sport: {
          [Op.like]: `%${sport.name}%`,
        },
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: sport.id.toString(),
        name: sport.name,
        icon: sport.icon,
        color: [sport.colorPrimary, sport.colorSecondary],
        image: sport.image,
        description: sport.description,
        athletes: athleteCount,
        exercises: (sport as any).exercises || [],
      },
    });
  } catch (error) {
    console.error('Get sport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sport',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get exercises for a specific sport
 * @route GET /api/sports/:id/exercises
 */
export const getSportExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { difficulty } = req.query;

    // Check if sport exists
    const sport = await Sport.findByPk(id);
    if (!sport) {
      res.status(404).json({
        success: false,
        message: 'Sport not found',
      });
      return;
    }

    // Build where clause
    const whereClause: any = {
      sportId: id,
      isActive: true,
    };

    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty as string)) {
      whereClause.difficulty = difficulty;
    }

    const exercises = await Exercise.findAll({
      where: whereClause,
      order: [
        ['difficulty', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        sport: {
          id: sport.id.toString(),
          name: sport.name,
          icon: sport.icon,
          color: [sport.colorPrimary, sport.colorSecondary],
          image: sport.image,
        },
        exercises: exercises.map((ex) => ({
          id: ex.id.toString(),
          name: ex.name,
          description: ex.description,
          icon: ex.icon,
          image: ex.image,
          videoUrl: ex.videoUrl,
          duration: ex.duration,
          difficulty: ex.difficulty,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          instructions: ex.instructions,
          benefits: ex.benefits,
          calories: ex.calories,
          sets: ex.sets,
          reps: ex.reps,
        })),
        total: exercises.length,
      },
    });
  } catch (error) {
    console.error('Get sport exercises error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercises',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create a new sport (Admin only)
 * @route POST /api/sports
 */
export const createSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { name, icon, colorPrimary, colorSecondary, image, description } = req.body;

    // Check if sport already exists
    const existing = await Sport.findOne({ where: { name } });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Sport with this name already exists',
      });
      return;
    }

    const sport = await Sport.create({
      name,
      icon,
      colorPrimary,
      colorSecondary,
      image,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Sport created successfully',
      data: sport,
    });
  } catch (error) {
    console.error('Create sport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sport',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create a new exercise for a sport
 * @route POST /api/sports/:id/exercises
 */
export const createExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;

    // Check if sport exists
    const sport = await Sport.findByPk(id);
    if (!sport) {
      res.status(404).json({
        success: false,
        message: 'Sport not found',
      });
      return;
    }

    const {
      name,
      description,
      icon,
      image,
      videoUrl,
      duration,
      difficulty,
      muscleGroups,
      equipment,
      instructions,
      benefits,
      calories,
      sets,
      reps,
    } = req.body;

    const exercise = await Exercise.create({
      sportId: parseInt(id),
      name,
      description,
      icon,
      image,
      videoUrl,
      duration,
      difficulty,
      muscleGroups: muscleGroups || [],
      equipment: equipment || [],
      instructions: instructions || [],
      benefits: benefits || [],
      calories,
      sets,
      reps,
    });

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise,
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exercise',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Seed initial sports and exercises data
 * @route POST /api/sports/seed
 */
export const seedSportsData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if data already exists
    const existingCount = await Sport.count();
    if (existingCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Sports data already exists. Delete existing data first.',
      });
      return;
    }

    // Sports data
    const sportsData = [
      {
        name: 'Cricket',
        icon: '🏏',
        colorPrimary: '#4CAF50',
        colorSecondary: '#2E7D32',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        description: 'Cricket fitness exercises to improve batting, bowling, and fielding performance.',
      },
      {
        name: 'Basketball',
        icon: '🏀',
        colorPrimary: '#FF9800',
        colorSecondary: '#E65100',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
        description: 'Basketball training exercises for agility, jumping, and court performance.',
      },
      {
        name: 'Swimming',
        icon: '🏊',
        colorPrimary: '#2196F3',
        colorSecondary: '#0D47A1',
        image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400',
        description: 'Swimming drills and exercises to improve stroke technique and endurance.',
      },
      {
        name: 'Volleyball',
        icon: '🏐',
        colorPrimary: '#9C27B0',
        colorSecondary: '#6A1B9A',
        image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400',
        description: 'Volleyball exercises focusing on jumping, spiking, and defensive movements.',
      },
      {
        name: 'Kabaddi',
        icon: '🤼',
        colorPrimary: '#F44336',
        colorSecondary: '#C62828',
        image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400',
        description: 'Kabaddi training for strength, agility, and raiding techniques.',
      },
      {
        name: 'Football',
        icon: '⚽',
        colorPrimary: '#00BCD4',
        colorSecondary: '#00838F',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
        description: 'Football exercises for dribbling, shooting, and overall fitness.',
      },
      {
        name: 'Tennis',
        icon: '🎾',
        colorPrimary: '#CDDC39',
        colorSecondary: '#9E9D24',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400',
        description: 'Tennis training for serves, volleys, and court movement.',
      },
      {
        name: 'Athletics',
        icon: '🏃',
        colorPrimary: '#FF5722',
        colorSecondary: '#BF360C',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        description: 'Track and field exercises for running, jumping, and throwing events.',
      },
    ];

    // Create sports
    const createdSports = await Sport.bulkCreate(sportsData);

    // Exercises data for each sport
    const exercisesData: any[] = [];

    // Cricket exercises
    exercisesData.push(
      {
        sportId: createdSports[0].id,
        name: 'Shadow Batting',
        description: 'Practice batting stance and shots without a ball to improve technique and muscle memory.',
        icon: '🏏',
        image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400',
        duration: 300,
        difficulty: 'beginner',
        muscleGroups: ['Arms', 'Core', 'Shoulders'],
        equipment: ['Bat'],
        instructions: [
          'Take your batting stance',
          'Practice defensive shots',
          'Work on drive shots',
          'Practice pull and cut shots',
          'Focus on footwork',
        ],
        benefits: ['Improved technique', 'Better muscle memory', 'Enhanced footwork'],
        calories: 80,
        sets: 3,
        reps: 10,
      },
      {
        sportId: createdSports[0].id,
        name: 'Bowling Run-up Drill',
        description: 'Perfect your bowling run-up and delivery action with this focused drill.',
        icon: '🎳',
        duration: 600,
        difficulty: 'intermediate',
        muscleGroups: ['Legs', 'Core', 'Shoulders', 'Arms'],
        equipment: ['Cricket ball', 'Stumps'],
        instructions: [
          'Mark your run-up distance',
          'Practice approach rhythm',
          'Focus on gather position',
          'Work on arm rotation',
          'Follow through properly',
        ],
        benefits: ['Consistent delivery', 'Better accuracy', 'Reduced injury risk'],
        calories: 150,
        sets: 5,
        reps: 6,
      },
      {
        sportId: createdSports[0].id,
        name: 'Catching Practice',
        description: 'Improve your catching reflexes and hand-eye coordination.',
        icon: '🤲',
        duration: 450,
        difficulty: 'beginner',
        muscleGroups: ['Hands', 'Arms', 'Core'],
        equipment: ['Cricket ball'],
        instructions: [
          'Start with soft catches',
          'Progress to hard catches',
          'Practice one-handed catches',
          'Work on diving catches',
          'Train peripheral vision catches',
        ],
        benefits: ['Better reflexes', 'Improved hand-eye coordination', 'Confident fielding'],
        calories: 100,
        sets: 4,
        reps: 15,
      }
    );

    // Basketball exercises
    exercisesData.push(
      {
        sportId: createdSports[1].id,
        name: 'Layup Drills',
        description: 'Practice various layup techniques to score easily near the basket.',
        icon: '🏀',
        image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400',
        duration: 600,
        difficulty: 'beginner',
        muscleGroups: ['Legs', 'Core', 'Arms'],
        equipment: ['Basketball', 'Hoop'],
        instructions: [
          'Start from the right side',
          'Dribble towards the basket',
          'Take off from left foot',
          'Extend right arm for layup',
          'Aim for backboard sweet spot',
        ],
        benefits: ['Improved scoring', 'Better footwork', 'Enhanced coordination'],
        calories: 120,
        sets: 4,
        reps: 10,
      },
      {
        sportId: createdSports[1].id,
        name: 'Defensive Slides',
        description: 'Build lateral quickness and defensive positioning skills.',
        icon: '🛡️',
        duration: 300,
        difficulty: 'intermediate',
        muscleGroups: ['Legs', 'Core', 'Glutes'],
        equipment: ['Cones'],
        instructions: [
          'Get in defensive stance',
          'Slide laterally between cones',
          'Keep hips low',
          'Maintain balance',
          'React to direction changes',
        ],
        benefits: ['Better defense', 'Improved agility', 'Stronger legs'],
        calories: 100,
        sets: 5,
        reps: 8,
      },
      {
        sportId: createdSports[1].id,
        name: 'Jump Shot Practice',
        description: 'Perfect your shooting form and accuracy from various spots.',
        icon: '🎯',
        duration: 900,
        difficulty: 'intermediate',
        muscleGroups: ['Arms', 'Shoulders', 'Legs'],
        equipment: ['Basketball', 'Hoop'],
        instructions: [
          'Set feet shoulder-width apart',
          'Hold ball in shooting pocket',
          'Jump and release at peak',
          'Follow through with wrist',
          'Practice from multiple spots',
        ],
        benefits: ['Improved accuracy', 'Consistent form', 'Better range'],
        calories: 150,
        sets: 5,
        reps: 10,
      }
    );

    // Swimming exercises
    exercisesData.push(
      {
        sportId: createdSports[2].id,
        name: 'Freestyle Technique Drill',
        description: 'Focus on proper freestyle stroke mechanics and breathing.',
        icon: '🏊',
        image: 'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=400',
        duration: 1200,
        difficulty: 'beginner',
        muscleGroups: ['Arms', 'Core', 'Shoulders', 'Back'],
        equipment: ['Pool', 'Goggles'],
        instructions: [
          'Start with body position drill',
          'Practice catch and pull',
          'Work on bilateral breathing',
          'Focus on hip rotation',
          'Maintain streamlined kick',
        ],
        benefits: ['Improved technique', 'Better efficiency', 'Faster times'],
        calories: 200,
        sets: 4,
        reps: 50,
      },
      {
        sportId: createdSports[2].id,
        name: 'Kick Sets',
        description: 'Strengthen your kick for better propulsion and body position.',
        icon: '🦵',
        duration: 600,
        difficulty: 'beginner',
        muscleGroups: ['Legs', 'Core', 'Glutes'],
        equipment: ['Pool', 'Kickboard'],
        instructions: [
          'Hold kickboard extended',
          'Keep legs straight but relaxed',
          'Kick from hips, not knees',
          'Maintain small, fast kicks',
          'Keep head down between breaths',
        ],
        benefits: ['Stronger kick', 'Better endurance', 'Improved body position'],
        calories: 150,
        sets: 6,
        reps: 25,
      }
    );

    // Volleyball exercises
    exercisesData.push(
      {
        sportId: createdSports[3].id,
        name: 'Spike Approach',
        description: 'Master the footwork and timing for powerful spikes.',
        icon: '🏐',
        image: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=400',
        duration: 600,
        difficulty: 'intermediate',
        muscleGroups: ['Legs', 'Core', 'Shoulders', 'Arms'],
        equipment: ['Volleyball', 'Net'],
        instructions: [
          'Start behind attack line',
          'Take explosive 3-step approach',
          'Plant both feet for jump',
          'Swing arm back and snap',
          'Follow through towards target',
        ],
        benefits: ['Powerful spikes', 'Better timing', 'Improved vertical'],
        calories: 180,
        sets: 4,
        reps: 12,
      },
      {
        sportId: createdSports[3].id,
        name: 'Passing Drills',
        description: 'Improve ball control and platform consistency.',
        icon: '🤲',
        duration: 450,
        difficulty: 'beginner',
        muscleGroups: ['Arms', 'Core', 'Legs'],
        equipment: ['Volleyball'],
        instructions: [
          'Form proper platform',
          'Bend knees for stability',
          'Contact ball on forearms',
          'Direct pass to target',
          'Move feet to ball',
        ],
        benefits: ['Better ball control', 'Consistent passes', 'Improved teamwork'],
        calories: 80,
        sets: 5,
        reps: 20,
      }
    );

    // Kabaddi exercises
    exercisesData.push(
      {
        sportId: createdSports[4].id,
        name: 'Raiding Practice',
        description: 'Practice raiding techniques including toe touch and hand touch.',
        icon: '🤼',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        duration: 600,
        difficulty: 'advanced',
        muscleGroups: ['Legs', 'Core', 'Arms', 'Full Body'],
        equipment: ['Mat'],
        instructions: [
          'Practice toe touch raids',
          'Work on hand touches',
          'Develop escape moves',
          'Train quick turns',
          'Build cant rhythm',
        ],
        benefits: ['Effective raids', 'Better agility', 'Improved scoring'],
        calories: 200,
        sets: 5,
        reps: 10,
      },
      {
        sportId: createdSports[4].id,
        name: 'Ankle Hold Defense',
        description: 'Master the ankle hold technique for strong defense.',
        icon: '🦶',
        duration: 450,
        difficulty: 'intermediate',
        muscleGroups: ['Arms', 'Core', 'Grip Strength'],
        equipment: ['Mat', 'Partner'],
        instructions: [
          'Time the raider approach',
          'Get low and grip ankle',
          'Pull back and down',
          'Work with chain formation',
          'Practice quick reactions',
        ],
        benefits: ['Strong defense', 'Better grip', 'Team coordination'],
        calories: 150,
        sets: 4,
        reps: 8,
      }
    );

    // Football exercises
    exercisesData.push(
      {
        sportId: createdSports[5].id,
        name: 'Dribbling Cones',
        description: 'Improve ball control and dribbling through cone obstacles.',
        icon: '⚽',
        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
        duration: 600,
        difficulty: 'beginner',
        muscleGroups: ['Legs', 'Core', 'Ankles'],
        equipment: ['Football', 'Cones'],
        instructions: [
          'Set up cone slalom',
          'Use inside and outside foot',
          'Keep ball close to feet',
          'Accelerate between cones',
          'Focus on both feet equally',
        ],
        benefits: ['Better ball control', 'Improved agility', 'Quick feet'],
        calories: 120,
        sets: 4,
        reps: 5,
      },
      {
        sportId: createdSports[5].id,
        name: 'Shooting Practice',
        description: 'Work on shooting accuracy and power from various positions.',
        icon: '🥅',
        duration: 900,
        difficulty: 'intermediate',
        muscleGroups: ['Legs', 'Core', 'Hip Flexors'],
        equipment: ['Football', 'Goal'],
        instructions: [
          'Practice instep shots',
          'Work on placed finishes',
          'Try volleys and half-volleys',
          'Shoot from different angles',
          'Focus on both feet',
        ],
        benefits: ['Improved finishing', 'Better power', 'Accurate shots'],
        calories: 160,
        sets: 5,
        reps: 10,
      }
    );

    // Tennis exercises
    exercisesData.push(
      {
        sportId: createdSports[6].id,
        name: 'Serve Practice',
        description: 'Perfect your serve technique for power and accuracy.',
        icon: '🎾',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400',
        duration: 900,
        difficulty: 'intermediate',
        muscleGroups: ['Shoulders', 'Core', 'Legs', 'Arms'],
        equipment: ['Tennis racket', 'Tennis balls', 'Court'],
        instructions: [
          'Practice ball toss consistency',
          'Work on trophy position',
          'Focus on pronation at contact',
          'Develop kick and slice serves',
          'Aim for specific targets',
        ],
        benefits: ['Powerful serves', 'Better accuracy', 'Free points'],
        calories: 150,
        sets: 4,
        reps: 15,
      },
      {
        sportId: createdSports[6].id,
        name: 'Groundstroke Rally',
        description: 'Build consistent and powerful forehand and backhand strokes.',
        icon: '🔄',
        duration: 1200,
        difficulty: 'beginner',
        muscleGroups: ['Arms', 'Core', 'Legs', 'Shoulders'],
        equipment: ['Tennis racket', 'Tennis balls', 'Court'],
        instructions: [
          'Start with crosscourt rallies',
          'Focus on topspin technique',
          'Maintain ready position',
          'Use proper footwork',
          'Aim for consistent depth',
        ],
        benefits: ['Consistent strokes', 'Better rally ability', 'Improved fitness'],
        calories: 200,
        sets: 3,
        reps: 50,
      }
    );

    // Athletics exercises
    exercisesData.push(
      {
        sportId: createdSports[7].id,
        name: 'Sprint Drills',
        description: 'Improve acceleration and top-end speed with these drills.',
        icon: '🏃',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400',
        duration: 900,
        difficulty: 'intermediate',
        muscleGroups: ['Legs', 'Core', 'Glutes', 'Hip Flexors'],
        equipment: ['Track', 'Starting blocks'],
        instructions: [
          'Practice block starts',
          'Work on acceleration phase',
          'Develop max velocity technique',
          'Focus on arm action',
          'Train deceleration control',
        ],
        benefits: ['Faster starts', 'Improved speed', 'Better race execution'],
        calories: 250,
        sets: 6,
        reps: 4,
      },
      {
        sportId: createdSports[7].id,
        name: 'Long Jump Technique',
        description: 'Master the approach, takeoff, and landing for long jump.',
        icon: '🦘',
        duration: 1200,
        difficulty: 'advanced',
        muscleGroups: ['Legs', 'Core', 'Glutes', 'Full Body'],
        equipment: ['Runway', 'Sand pit'],
        instructions: [
          'Measure and mark approach',
          'Build speed progressively',
          'Hit board with penultimate step',
          'Drive knee up on takeoff',
          'Use hitch-kick or hang technique',
        ],
        benefits: ['Greater distance', 'Better technique', 'Consistent jumps'],
        calories: 200,
        sets: 5,
        reps: 6,
      }
    );

    // Create all exercises
    await Exercise.bulkCreate(exercisesData);

    res.status(201).json({
      success: true,
      message: 'Sports and exercises data seeded successfully',
      data: {
        sportsCreated: createdSports.length,
        exercisesCreated: exercisesData.length,
      },
    });
  } catch (error) {
    console.error('Seed sports data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed sports data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
