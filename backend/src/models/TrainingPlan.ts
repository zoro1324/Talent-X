import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Training Plan Difficulty Levels
 */
export type PlanDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'elite';

/**
 * Training Plan Attributes Interface
 */
export interface ITrainingPlanAttributes {
  id: number;
  athleteId: number;
  sport: string;
  difficulty: PlanDifficulty;
  weeklyVolume: number; // Total minutes per week
  weeklyIntensity: number; // 1-10 scale
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  lastAdaptedAt: Date | null;
  performanceHistory: IPerformanceSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Performance Snapshot for adaptive planning
 */
export interface IPerformanceSnapshot {
  date: string;
  testType: string;
  score: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Training Plan Creation Attributes
 */
export interface ITrainingPlanCreationAttributes extends Optional<ITrainingPlanAttributes,
  'id' | 'endDate' | 'isActive' | 'lastAdaptedAt' | 'performanceHistory' | 'createdAt' | 'updatedAt'> {}

/**
 * Training Plan Model Class
 */
class TrainingPlan extends Model<ITrainingPlanAttributes, ITrainingPlanCreationAttributes> implements ITrainingPlanAttributes {
  public id!: number;
  public athleteId!: number;
  public sport!: string;
  public difficulty!: PlanDifficulty;
  public weeklyVolume!: number;
  public weeklyIntensity!: number;
  public startDate!: Date;
  public endDate!: Date | null;
  public isActive!: boolean;
  public lastAdaptedAt!: Date | null;
  public performanceHistory!: IPerformanceSnapshot[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize TrainingPlan Model
 */
TrainingPlan.init(
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
    sport: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'elite'),
      allowNull: false,
    },
    weeklyVolume: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'weekly_volume',
      validate: {
        min: 60,
        max: 1200,
      },
    },
    weeklyIntensity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'weekly_intensity',
      validate: {
        min: 1,
        max: 10,
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    lastAdaptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_adapted_at',
    },
    performanceHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'performance_history',
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
    tableName: 'training_plans',
    modelName: 'TrainingPlan',
    indexes: [
      { fields: ['athlete_id', 'is_active'] },
      { fields: ['sport'] },
    ],
  }
);

export default TrainingPlan;
