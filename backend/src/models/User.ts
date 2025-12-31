import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

/**
 * User Attributes Interface
 */
export interface IUserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  verificationOTP: string | null;
  otpExpiry: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpiry: Date | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Creation Attributes (optional fields for creation)
 */
export interface IUserCreationAttributes extends Optional<IUserAttributes, 
  'id' | 'isVerified' | 'verificationOTP' | 'otpExpiry' | 'resetPasswordToken' | 
  'resetPasswordExpiry' | 'lastLogin' | 'createdAt' | 'updatedAt'> {}

/**
 * User Model Class
 */
class User extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public isVerified!: boolean;
  public verificationOTP!: string | null;
  public otpExpiry!: Date | null;
  public resetPasswordToken!: string | null;
  public resetPasswordExpiry!: Date | null;
  public lastLogin!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Compare password
   */
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationOTP = otp;
    this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return otp;
  }
}

/**
 * Initialize User Model
 */
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
    },
    verificationOTP: {
      type: DataTypes.STRING(6),
      allowNull: true,
      field: 'verification_otp',
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'otp_expiry',
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reset_password_token',
    },
    resetPasswordExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_expiry',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
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
    tableName: 'users',
    modelName: 'User',
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
