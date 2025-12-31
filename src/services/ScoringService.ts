/**
 * Scoring service for standardized fitness test assessment
 * Provides normalized scores, percentile rankings, and grades
 */

import type {
  FitnessTestType,
  TestScore,
  RepetitionData,
  NormativeData,
} from '../types';

/**
 * Normative data for fitness tests by age group and gender.
 * 
 * Sources and References:
 * - Squats: Based on ACSM (American College of Sports Medicine) guidelines for
 *   lower body muscular endurance assessments
 * - Push-ups: Based on Canadian Society for Exercise Physiology fitness norms
 *   and ACSM health-related fitness assessment protocols
 * - Vertical Jump: Based on NSCA (National Strength and Conditioning Association)
 *   normative data for athletic populations
 * 
 * Note: These values represent general population fitness levels. Athletes may
 * score significantly higher. Values are rounded to whole numbers for simplicity.
 * 
 * Data Version: 1.0 (December 2024)
 * Last Updated: December 2024
 * Review Frequency: Annual updates recommended based on new research
 */
const NORMATIVE_DATA: NormativeData[] = [
  // Squats (60-second test) - reps per minute
  { testType: 'squats', gender: 'male', ageMin: 18, ageMax: 25, percentiles: { p10: 20, p25: 25, p50: 35, p75: 45, p90: 55 } },
  { testType: 'squats', gender: 'male', ageMin: 26, ageMax: 35, percentiles: { p10: 18, p25: 22, p50: 32, p75: 42, p90: 50 } },
  { testType: 'squats', gender: 'male', ageMin: 36, ageMax: 45, percentiles: { p10: 15, p25: 20, p50: 28, p75: 38, p90: 45 } },
  { testType: 'squats', gender: 'male', ageMin: 46, ageMax: 55, percentiles: { p10: 12, p25: 17, p50: 24, p75: 32, p90: 40 } },
  { testType: 'squats', gender: 'female', ageMin: 18, ageMax: 25, percentiles: { p10: 18, p25: 22, p50: 30, p75: 40, p90: 48 } },
  { testType: 'squats', gender: 'female', ageMin: 26, ageMax: 35, percentiles: { p10: 15, p25: 20, p50: 28, p75: 36, p90: 44 } },
  { testType: 'squats', gender: 'female', ageMin: 36, ageMax: 45, percentiles: { p10: 12, p25: 17, p50: 24, p75: 32, p90: 40 } },
  { testType: 'squats', gender: 'female', ageMin: 46, ageMax: 55, percentiles: { p10: 10, p25: 14, p50: 20, p75: 28, p90: 35 } },

  // Push-ups (60-second test) - reps per minute
  { testType: 'pushups', gender: 'male', ageMin: 18, ageMax: 25, percentiles: { p10: 15, p25: 22, p50: 35, p75: 45, p90: 55 } },
  { testType: 'pushups', gender: 'male', ageMin: 26, ageMax: 35, percentiles: { p10: 12, p25: 18, p50: 30, p75: 40, p90: 48 } },
  { testType: 'pushups', gender: 'male', ageMin: 36, ageMax: 45, percentiles: { p10: 10, p25: 15, p50: 25, p75: 35, p90: 42 } },
  { testType: 'pushups', gender: 'male', ageMin: 46, ageMax: 55, percentiles: { p10: 8, p25: 12, p50: 20, p75: 28, p90: 35 } },
  { testType: 'pushups', gender: 'female', ageMin: 18, ageMax: 25, percentiles: { p10: 10, p25: 15, p50: 22, p75: 30, p90: 38 } },
  { testType: 'pushups', gender: 'female', ageMin: 26, ageMax: 35, percentiles: { p10: 8, p25: 12, p50: 18, p75: 26, p90: 32 } },
  { testType: 'pushups', gender: 'female', ageMin: 36, ageMax: 45, percentiles: { p10: 6, p25: 10, p50: 15, p75: 22, p90: 28 } },
  { testType: 'pushups', gender: 'female', ageMin: 46, ageMax: 55, percentiles: { p10: 4, p25: 8, p50: 12, p75: 18, p90: 24 } },

  // Vertical Jump (in centimeters)
  { testType: 'jump', gender: 'male', ageMin: 18, ageMax: 25, percentiles: { p10: 35, p25: 42, p50: 52, p75: 62, p90: 72 } },
  { testType: 'jump', gender: 'male', ageMin: 26, ageMax: 35, percentiles: { p10: 32, p25: 38, p50: 48, p75: 58, p90: 68 } },
  { testType: 'jump', gender: 'male', ageMin: 36, ageMax: 45, percentiles: { p10: 28, p25: 34, p50: 42, p75: 52, p90: 60 } },
  { testType: 'jump', gender: 'male', ageMin: 46, ageMax: 55, percentiles: { p10: 24, p25: 30, p50: 38, p75: 46, p90: 54 } },
  { testType: 'jump', gender: 'female', ageMin: 18, ageMax: 25, percentiles: { p10: 25, p25: 32, p50: 40, p75: 48, p90: 55 } },
  { testType: 'jump', gender: 'female', ageMin: 26, ageMax: 35, percentiles: { p10: 22, p25: 28, p50: 36, p75: 44, p90: 50 } },
  { testType: 'jump', gender: 'female', ageMin: 36, ageMax: 45, percentiles: { p10: 18, p25: 24, p50: 32, p75: 40, p90: 46 } },
  { testType: 'jump', gender: 'female', ageMin: 46, ageMax: 55, percentiles: { p10: 15, p25: 20, p50: 28, p75: 35, p90: 42 } },
];

/**
 * Get normative data for a specific test, gender, and age
 */
function getNormativeData(
  testType: FitnessTestType,
  gender: 'male' | 'female' | 'other',
  age: number
): NormativeData | null {
  // Use male norms as default for 'other' gender
  const genderToUse = gender === 'other' ? 'male' : gender;
  
  return NORMATIVE_DATA.find(
    (n) =>
      n.testType === testType &&
      n.gender === genderToUse &&
      age >= n.ageMin &&
      age <= n.ageMax
  ) || null;
}

/**
 * Calculate percentile rank based on raw score and normative data
 */
function calculatePercentile(rawScore: number, normData: NormativeData): number {
  const { p10, p25, p50, p75, p90 } = normData.percentiles;

  if (rawScore <= p10) {
    return Math.round((rawScore / p10) * 10);
  } else if (rawScore <= p25) {
    return Math.round(10 + ((rawScore - p10) / (p25 - p10)) * 15);
  } else if (rawScore <= p50) {
    return Math.round(25 + ((rawScore - p25) / (p50 - p25)) * 25);
  } else if (rawScore <= p75) {
    return Math.round(50 + ((rawScore - p50) / (p75 - p50)) * 25);
  } else if (rawScore <= p90) {
    return Math.round(75 + ((rawScore - p75) / (p90 - p75)) * 15);
  } else {
    // Above 90th percentile
    return Math.min(99, Math.round(90 + ((rawScore - p90) / p90) * 10));
  }
}

/**
 * Convert percentile to letter grade
 */
function getGrade(percentile: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentile >= 80) return 'A';
  if (percentile >= 60) return 'B';
  if (percentile >= 40) return 'C';
  if (percentile >= 20) return 'D';
  return 'F';
}

/**
 * Convert percentile to standardized 0-100 score
 */
function standardizeScore(percentile: number): number {
  return Math.round(percentile);
}

/**
 * Generate feedback messages based on performance
 */
function generateFeedback(
  testType: FitnessTestType,
  rawScore: number,
  percentile: number,
  averageFormScore: number,
  repetitions: RepetitionData[]
): string[] {
  const feedback: string[] = [];

  // Performance feedback
  if (percentile >= 80) {
    feedback.push('Excellent performance! You are in the top 20%.');
  } else if (percentile >= 60) {
    feedback.push('Good job! Above average performance.');
  } else if (percentile >= 40) {
    feedback.push('Average performance. Keep practicing to improve.');
  } else if (percentile >= 20) {
    feedback.push('Below average. Consider more focused training.');
  } else {
    feedback.push('Keep working at it! Consistent practice will help.');
  }

  // Form feedback
  if (averageFormScore >= 90) {
    feedback.push('Outstanding form throughout the test!');
  } else if (averageFormScore >= 75) {
    feedback.push('Good form overall, with minor areas for improvement.');
  } else if (averageFormScore >= 60) {
    feedback.push('Focus on maintaining proper form to maximize results.');
  } else {
    feedback.push('Form needs significant improvement for safety and effectiveness.');
  }

  // Test-specific tips
  switch (testType) {
    case 'squats':
      if (rawScore < 20) {
        feedback.push('Try to maintain a steady pace and focus on depth.');
      }
      feedback.push('Remember: keep your chest up and knees tracking over toes.');
      break;
    case 'pushups':
      if (rawScore < 15) {
        feedback.push('Start with modified push-ups to build strength.');
      }
      feedback.push('Tip: maintain a straight line from head to heels.');
      break;
    case 'jump':
      feedback.push('Tip: use arm swing to generate more power.');
      feedback.push('Focus on explosive hip extension for maximum height.');
      break;
  }

  // Consistency feedback
  if (repetitions.length >= 3) {
    const durations = repetitions.map((r) => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < avgDuration * 0.15) {
      feedback.push('Great consistency in your repetition timing!');
    } else if (stdDev > avgDuration * 0.3) {
      feedback.push('Work on maintaining a more consistent pace.');
    }
  }

  return feedback;
}

/**
 * Scoring Service for fitness test assessment
 */
export class ScoringService {
  /**
   * Calculate comprehensive score for a completed test
   */
  static calculateScore(
    testType: FitnessTestType,
    rawScore: number, // Rep count or jump height
    repetitions: RepetitionData[],
    gender: 'male' | 'female' | 'other',
    dateOfBirth: string
  ): TestScore {
    // Calculate age from date of birth
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Clamp age to supported range
    age = Math.max(18, Math.min(55, age));

    // Get normative data
    const normData = getNormativeData(testType, gender, age);

    // Calculate percentile
    let percentile = 50; // Default to median if no normative data
    if (normData) {
      percentile = calculatePercentile(rawScore, normData);
    }

    // Calculate average form score
    const averageFormScore =
      repetitions.length > 0
        ? repetitions.reduce((sum, r) => sum + r.formScore, 0) / repetitions.length
        : 100;

    // Adjust score based on form (form accounts for 20% of final score)
    const formAdjustment = (averageFormScore / 100) * 0.2;
    const performanceWeight = 0.8;
    const adjustedPercentile = Math.round(
      percentile * performanceWeight + percentile * formAdjustment
    );

    // Generate standardized score and grade
    const standardizedScore = standardizeScore(adjustedPercentile);
    const grade = getGrade(adjustedPercentile);

    // Generate feedback
    const feedback = generateFeedback(
      testType,
      rawScore,
      percentile,
      averageFormScore,
      repetitions
    );

    return {
      rawScore,
      standardizedScore,
      percentile,
      grade,
      feedback,
    };
  }

  /**
   * Get test description and instructions
   */
  static getTestInfo(testType: FitnessTestType): {
    name: string;
    description: string;
    instructions: string[];
    duration: number; // seconds
    metric: string;
  } {
    switch (testType) {
      case 'squats':
        return {
          name: 'Bodyweight Squats',
          description: 'Tests lower body strength and endurance',
          instructions: [
            'Stand with feet shoulder-width apart',
            'Lower your body until thighs are parallel to ground',
            'Keep your chest up and knees over toes',
            'Push through heels to stand back up',
            'Repeat as many times as possible in 60 seconds',
          ],
          duration: 60,
          metric: 'repetitions',
        };
      case 'pushups':
        return {
          name: 'Push-Ups',
          description: 'Tests upper body strength and endurance',
          instructions: [
            'Start in plank position with hands shoulder-width apart',
            'Lower your body until chest nearly touches the ground',
            'Keep body in straight line from head to heels',
            'Push back up to starting position',
            'Repeat as many times as possible in 60 seconds',
          ],
          duration: 60,
          metric: 'repetitions',
        };
      case 'jump':
        return {
          name: 'Vertical Jump',
          description: 'Tests explosive lower body power',
          instructions: [
            'Stand facing the camera with feet shoulder-width apart',
            'Bend knees and swing arms back',
            'Jump as high as possible, reaching upward',
            'Land softly with bent knees',
            'Perform 3-5 jumps, best height will be recorded',
          ],
          duration: 30,
          metric: 'height (cm)',
        };
    }
  }

  /**
   * Get grade description
   */
  static getGradeDescription(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
    switch (grade) {
      case 'A':
        return 'Excellent - Top 20%';
      case 'B':
        return 'Good - Above Average';
      case 'C':
        return 'Average - Middle Range';
      case 'D':
        return 'Below Average - Needs Improvement';
      case 'F':
        return 'Poor - Significant Improvement Needed';
    }
  }
}
