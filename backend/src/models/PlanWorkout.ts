import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Workout Type
 */
export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'skill' | 'recovery';

/**
 * Exercise in a workout
 */
export interface IWorkoutExercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  intensity?: string; // e.g., "moderate", "high"
  notes?: string;
}

/**
 * Plan Workout Attributes Interface
 */
export interface IPlanWorkoutAttributes {
  id: number;
  planId: number;
  weekNumber: number;
  dayNumber: number; // 1-7
  workoutType: WorkoutType;
  title: string;
  description: string | null;
  exercises: IWorkoutExercise[];
  estimatedDuration: number; // minutes
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plan Workout Creation Attributes
 */
export interface IPlanWorkoutCreationAttributes extends Optional<IPlanWorkoutAttributes,
  'id' | 'description' | 'completed' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

/**
 * Plan Workout Model Class
 */
class PlanWorkout extends Model<IPlanWorkoutAttributes, IPlanWorkoutCreationAttributes> implements IPlanWorkoutAttributes {
  public id!: number;
  public planId!: number;
  public weekNumber!: number;
  public dayNumber!: number;
  public workoutType!: WorkoutType;
  public title!: string;
  public description!: string | null;
  public exercises!: IWorkoutExercise[];
  public estimatedDuration!: number;
  public completed!: boolean;
  public completedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize PlanWorkout Model
 */
PlanWorkout.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'plan_id',
      references: {
        model: 'training_plans',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'week_number',
      validate: {
        min: 1,
      },
    },
    dayNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_number',
      validate: {
        min: 1,
        max: 7,
      },
    },
    workoutType: {
      type: DataTypes.ENUM('strength', 'cardio', 'flexibility', 'skill', 'recovery'),
      allowNull: false,
      field: 'workout_type',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exercises: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'estimated_duration',
      validate: {
        min: 5,
        max: 180,
      },
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
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
    tableName: 'plan_workouts',
    modelName: 'PlanWorkout',
    indexes: [
      { fields: ['plan_id', 'week_number', 'day_number'] },
      { fields: ['completed'] },
    ],
  }
);

export default PlanWorkout;
