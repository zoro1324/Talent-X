/**
 * Type definitions for Talent-X fitness assessment app
 */

/** Supported fitness test types */
export type FitnessTestType = 'squats' | 'pushups' | 'jump';

/** Body pose keypoint names for pose detection */
export type KeypointName =
  | 'nose'
  | 'left_eye'
  | 'right_eye'
  | 'left_ear'
  | 'right_ear'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle';

/** Single pose keypoint with position and confidence */
export interface Keypoint {
  name: KeypointName;
  x: number;
  y: number;
  score: number; // Confidence score 0-1
}

/** Full body pose detection result */
export interface Pose {
  keypoints: Keypoint[];
  score: number; // Overall pose confidence
}

/** Athlete profile information */
export interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  height?: number; // in centimeters
  weight?: number; // in kilograms
  sport?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** Scoring result for a fitness test */
export interface TestScore {
  rawScore: number; // e.g., rep count or jump height
  standardizedScore: number; // 0-100 normalized score
  percentile?: number; // Percentile rank
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];
}

/** Single repetition data during a test */
export interface RepetitionData {
  startTime: number;
  endTime: number;
  duration: number; // milliseconds
  formScore: number; // 0-100
  issues: string[];
}

/** Exercise state during active test */
export type ExercisePhase = 'idle' | 'starting' | 'down' | 'up' | 'completed';

/** Real-time exercise analysis state */
export interface ExerciseState {
  phase: ExercisePhase;
  repCount: number;
  formScore: number;
  currentAngle?: number;
  feedback: string;
}

/** Completed fitness test result */
export interface TestResult {
  id: string;
  athleteId: string;
  testType: FitnessTestType;
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
  duration: number; // Total test duration in seconds
  repetitions: RepetitionData[];
  totalReps: number;
  score: TestScore;
  averageFormScore: number;
  createdAt: string; // ISO timestamp
}

/** Navigation route params */
export type RootStackParamList = {
  Home: undefined;
  ProfileCreate: undefined;
  ProfileEdit: { athleteId: string };
  ProfileView: { athleteId: string };
  TestSelect: { athleteId: string };
  TestCamera: { athleteId: string; testType: FitnessTestType };
  TestResult: { resultId: string };
  History: { athleteId: string };
};

/** App settings stored locally */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showFormGuides: boolean;
  testDuration: number; // seconds, 0 for unlimited
  lowPowerMode: boolean; // Reduced AI processing for low-end devices
}

/** Scoring normative data by age and gender */
export interface NormativeData {
  testType: FitnessTestType;
  gender: 'male' | 'female';
  ageMin: number;
  ageMax: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}
