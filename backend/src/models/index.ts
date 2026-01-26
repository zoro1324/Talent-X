import User from './User';
import Athlete from './Athlete';
import TestResult from './TestResult';
import Sport from './Sport';
import Exercise from './Exercise';
import TrainingPlan from './TrainingPlan';
import PlanWorkout from './PlanWorkout';

// Define associations
User.hasMany(Athlete, { foreignKey: 'userId', as: 'athletes' });
Athlete.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(TestResult, { foreignKey: 'userId', as: 'testResults' });
TestResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Athlete.hasMany(TestResult, { foreignKey: 'athleteId', as: 'testResults' });
TestResult.belongsTo(Athlete, { foreignKey: 'athleteId', as: 'athlete' });

// Training plan associations
Athlete.hasMany(TrainingPlan, { foreignKey: 'athleteId', as: 'trainingPlans' });
TrainingPlan.belongsTo(Athlete, { foreignKey: 'athleteId', as: 'athlete' });

TrainingPlan.hasMany(PlanWorkout, { foreignKey: 'planId', as: 'workouts' });
PlanWorkout.belongsTo(TrainingPlan, { foreignKey: 'planId', as: 'plan' });

// Sport and Exercise associations
Sport.hasMany(Exercise, { foreignKey: 'sportId', as: 'exercises' });
Exercise.belongsTo(Sport, { foreignKey: 'sportId', as: 'sport' });

/**
 * Export all models
 */
export { User, Athlete, TestResult, Sport, Exercise, TrainingPlan, PlanWorkout };
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
export type { ISportAttributes, ISportCreationAttributes } from './Sport';
export type { IExerciseAttributes, IExerciseCreationAttributes, DifficultyLevel } from './Exercise';
export type { ITrainingPlanAttributes, ITrainingPlanCreationAttributes, IPerformanceSnapshot, PlanDifficulty } from './TrainingPlan';
export type { IPlanWorkoutAttributes, IPlanWorkoutCreationAttributes, IWorkoutExercise, WorkoutType } from './PlanWorkout';
