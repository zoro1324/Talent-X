import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
  let connection;
  
  try {
    console.log('Starting migration for test types...');
    
    // Create direct MySQL connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'talentx',
    });
    
    console.log('✅ Connected to database');
    
    // Run the ALTER TABLE query
    await connection.execute(`
      ALTER TABLE test_results 
      MODIFY COLUMN test_type ENUM(
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
      )
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ test_type ENUM updated with 16 new test types.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();

