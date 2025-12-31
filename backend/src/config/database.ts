import { Sequelize } from 'sequelize';

/**
 * MySQL Database Configuration using Sequelize
 */

const sequelize = new Sequelize(
  process.env.DB_NAME || 'talentx',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true, // Use snake_case for column names
    },
  }
);

/**
 * Connect to MySQL database
 */
export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log(`
╔════════════════════════════════════╗
║  MySQL Connected Successfully      ║
║  Host: ${(process.env.DB_HOST || 'localhost').padEnd(25)}║
║  Database: ${(process.env.DB_NAME || 'talentx').padEnd(22)}║
╚════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('MySQL connection failed:', error);
    process.exit(1);
  }
};

/**
 * Sync database models (create tables)
 */
export const syncDB = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database sync failed:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDB = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('MySQL connection closed gracefully');
  } catch (error) {
    console.error('Error closing MySQL connection:', error);
  }
};

export default sequelize;
