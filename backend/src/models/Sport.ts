import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Sport Attributes Interface
 */
export interface ISportAttributes {
  id: number;
  name: string;
  icon: string;
  colorPrimary: string;
  colorSecondary: string;
  image: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sport Creation Attributes
 */
export interface ISportCreationAttributes extends Optional<ISportAttributes,
  'id' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * Sport Model Class
 */
class Sport extends Model<ISportAttributes, ISportCreationAttributes> implements ISportAttributes {
  public id!: number;
  public name!: string;
  public icon!: string;
  public colorPrimary!: string;
  public colorSecondary!: string;
  public image!: string;
  public description!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize Sport Model
 */
Sport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Emoji or icon identifier',
    },
    colorPrimary: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'color_primary',
      comment: 'Primary gradient color (hex)',
    },
    colorSecondary: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'color_secondary',
      comment: 'Secondary gradient color (hex)',
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Image URL for the sport',
    },
    description: {
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
    tableName: 'sports',
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Sport;
