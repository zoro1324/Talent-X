import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Difficulty levels for exercises
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Exercise Attributes Interface
 */
export interface IExerciseAttributes {
  id: number;
  sportId: number;
  name: string;
  description: string;
  icon: string;
  image: string | null;
  videoUrl: string | null;
  duration: number; // in seconds
  difficulty: DifficultyLevel;
  muscleGroups: string[]; // JSON array stored as string
  equipment: string[]; // JSON array stored as string
  instructions: string[]; // JSON array stored as string
  benefits: string[]; // JSON array stored as string
  calories: number; // estimated calories burned
  sets: number | null;
  reps: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Exercise Creation Attributes
 */
export interface IExerciseCreationAttributes extends Optional<IExerciseAttributes,
  'id' | 'image' | 'videoUrl' | 'sets' | 'reps' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * Exercise Model Class
 */
class Exercise extends Model<IExerciseAttributes, IExerciseCreationAttributes> implements IExerciseAttributes {
  public id!: number;
  public sportId!: number;
  public name!: string;
  public description!: string;
  public icon!: string;
  public image!: string | null;
  public videoUrl!: string | null;
  public duration!: number;
  public difficulty!: DifficultyLevel;
  public muscleGroups!: string[];
  public equipment!: string[];
  public instructions!: string[];
  public benefits!: string[];
  public calories!: number;
  public sets!: number | null;
  public reps!: number | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Get formatted duration
   */
  getFormattedDuration(): string {
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    if (minutes > 0) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  }
}

/**
 * Initialize Exercise Model
 */
Exercise.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sport_id',
      references: {
        model: 'sports',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Emoji or icon identifier',
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Image URL for the exercise',
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'video_url',
      comment: 'Video tutorial URL',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in seconds',
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
    },
    muscleGroups: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'muscle_groups',
      comment: 'Array of targeted muscle groups',
    },
    equipment: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of required equipment',
    },
    instructions: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of step-by-step instructions',
    },
    benefits: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of exercise benefits',
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Estimated calories burned',
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Recommended number of sets',
    },
    reps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Recommended number of reps',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'exercises',
    timestamps: true,
    indexes: [
      {
        fields: ['sport_id'],
      },
      {
        fields: ['difficulty'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Exercise;
