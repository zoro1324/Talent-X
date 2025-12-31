import User from './User';
import Athlete from './Athlete';
import TestResult from './TestResult';

// Define associations
User.hasMany(Athlete, { foreignKey: 'userId', as: 'athletes' });
Athlete.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(TestResult, { foreignKey: 'userId', as: 'testResults' });
TestResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Athlete.hasMany(TestResult, { foreignKey: 'athleteId', as: 'testResults' });
TestResult.belongsTo(Athlete, { foreignKey: 'athleteId', as: 'athlete' });

/**
 * Export all models
 */
export { User, Athlete, TestResult };
export type { IUserAttributes, IUserCreationAttributes } from './User';
export type { IAthleteAttributes, IAthleteCreationAttributes } from './Athlete';
export type { 
  ITestResultAttributes, 
  ITestResultCreationAttributes,
  IRepetitionData, 
  ITestScore,
  FitnessTestType,
  GradeType 
} from './TestResult';
