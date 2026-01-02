/**
 * Services index - export all services
 */

export { StorageService } from './StorageService';
export { PoseAnalysisService, ExerciseTracker } from './PoseAnalysisService';
export { ScoringService } from './ScoringService';
export { generateOTP, sendOTPEmail, sendOTPViaWeb3Forms } from './EmailService';
export { ApiService } from './ApiService';
export type { SportCategory, Exercise, SportExercisesResponse } from './ApiService';
