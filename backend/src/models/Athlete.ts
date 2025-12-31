import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Athlete Attributes Interface
 */
export interface IAthleteAttributes {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  height: number | null;
  weight: number | null;
  sport: string | null;
  profileImage: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Athlete Creation Attributes
 */
export interface IAthleteCreationAttributes extends Optional<IAthleteAttributes,
  'id' | 'height' | 'weight' | 'sport' | 'profileImage' | 'notes' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * Athlete Model Class
 */
class Athlete extends Model<IAthleteAttributes, IAthleteCreationAttributes> implements IAthleteAttributes {
  public id!: number;
  public userId!: number;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth!: Date;
  public gender!: 'male' | 'female' | 'other';
  public height!: number | null;
  public weight!: number | null;
  public sport!: string | null;
  public profileImage!: string | null;
  public notes!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Calculate age from date of birth
   */
  getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

/**
 * Initialize Athlete Model
 */
Athlete.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'last_name',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_of_birth',
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 50,
        max: 300,
      },
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 10,
        max: 500,
      },
    },
    sport: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_image',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'athletes',
    modelName: 'Athlete',
    indexes: [
      { fields: ['user_id', 'is_active'] },
      { fields: ['last_name', 'first_name'] },
    ],
  }
);

export default Athlete;
