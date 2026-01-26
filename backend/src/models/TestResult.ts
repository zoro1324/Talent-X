import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Fitness Test Types
 */
export type FitnessTestType =
  | 'squats'
  | 'pushups'
  | 'jump'
  | 'situps'
  | 'pullups'
  | 'running'
  | 'plank'
  | 'wall_sit'
  | 'burpees'
  | 'lunges'
  | 'mountain_climbers'
  | 'broad_jump'
  | 'single_leg_balance'
  | 'lateral_hops'
  | 'hand_release_pushups'
  | 'shuttle_run';

/**
 * Grade Type
 */
export type GradeType = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Repetition Data Interface
 */
export interface IRepetitionData {
  startTime: number;
  endTime: number;
  duration: number;
  formScore: number;
  issues: string[];
}

/**
 * Test Score Interface
 */
export interface ITestScore {
  rawScore: number;
  standardizedScore: number;
  percentile?: number;
  grade: GradeType;
  feedback: string[];
}

/**
 * Test Result Attributes Interface
 */
export interface ITestResultAttributes {
  id: number;
  athleteId: number;
  userId: number;
  testType: FitnessTestType;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  repetitions: IRepetitionData[];
  totalReps: number;
  score: ITestScore;
  averageFormScore: number;
  notes: string | null;
  videoUrl: string | null;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Test Result Creation Attributes
 */
export interface ITestResultCreationAttributes extends Optional<ITestResultAttributes,
  'id' | 'notes' | 'videoUrl' | 'isValid' | 'createdAt' | 'updatedAt'> {}

/**
 * Test Result Model Class
 */
class TestResult extends Model<ITestResultAttributes, ITestResultCreationAttributes> implements ITestResultAttributes {
  public id!: number;
  public athleteId!: number;
  public userId!: number;
  public testType!: FitnessTestType;
  public startedAt!: Date;
  public completedAt!: Date;
  public duration!: number;
  public repetitions!: IRepetitionData[];
  public totalReps!: number;
  public score!: ITestScore;
  public averageFormScore!: number;
  public notes!: string | null;
  public videoUrl!: string | null;
  public isValid!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize TestResult Model
 */
TestResult.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    athleteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'athlete_id',
      references: {
        model: 'athletes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    testType: {
      type: DataTypes.ENUM(
        'squats',
        'pushups',
        'jump',
        'situps',
        'pullups',
        'running',
        'plank',
        'wall_sit',
        'burpees',
        'lunges',
        'mountain_climbers',
        'broad_jump',
        'single_leg_balance',
        'lateral_hops',
        'hand_release_pushups',
        'shuttle_run'
      ),
      allowNull: false,
      field: 'test_type',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'completed_at',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    repetitions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    totalReps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_reps',
    },
    score: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    averageFormScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'average_form_score',
      validate: {
        min: 0,
        max: 100,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'video_url',
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_valid',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'test_results',
    modelName: 'TestResult',
    indexes: [
      { fields: ['athlete_id', 'test_type'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['test_type'] },
    ],
  }
);

export default TestResult;
