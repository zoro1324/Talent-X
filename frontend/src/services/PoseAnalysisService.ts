/**
 * On-device pose analysis service
 * Uses simplified keypoint detection optimized for low-end devices
 * All processing runs locally without internet dependency
 */

import type {
  Pose,
  Keypoint,
  KeypointName,
  FitnessTestType,
  ExerciseState,
  ExercisePhase,
  RepetitionData,
} from '../types';

/**
 * Minimum confidence threshold for keypoint detection.
 * Set to 0.3 to balance between:
 * - Detection reliability: Higher values might miss valid keypoints in poor lighting
 * - Accuracy: Lower values could include noisy/incorrect keypoints
 * This threshold works well on low-end devices where pose estimation may be less accurate.
 * Based on TensorFlow.js MoveNet documentation recommendations.
 */
const MIN_CONFIDENCE = 0.3;

/** Angle thresholds for exercise detection */
const EXERCISE_THRESHOLDS = {
  squats: {
    standingKneeAngle: 160, // Standing position
    squatKneeAngle: 90, // Deep squat
    hipAngleThreshold: 100, // Hip bent threshold
  },
  pushups: {
    upElbowAngle: 160, // Arms extended
    downElbowAngle: 90, // Arms bent
    bodyAlignmentTolerance: 20, // Degrees deviation allowed
  },
  jump: {
    standingAnkleY: 0, // Baseline ankle position
    jumpThreshold: 0.1, // Minimum jump height (relative to body height)
  },
  situps: {
    upHipAngle: 45, // Sit-up position (torso close to knees)
    downHipAngle: 160, // Lying down position
  },
  pullups: {
    upElbowAngle: 90, // Bent arms (chin above bar)
    downElbowAngle: 160, // Extended arms
    chinAboveBarThreshold: 0.05, // Chin should be 5% above wrist level
  },
  running: {
    minStepHeight: 0.05, // Minimum ankle lift relative to body height
    maxStrideDuration: 1500, // Maximum ms between steps (slow walking threshold)
  },
} as const;

/**
 * Calculate angle between three points in degrees
 */
function calculateAngle(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number }, // Vertex point
  pointC: { x: number; y: number }
): number {
  const radians =
    Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Get a specific keypoint from pose by name
 */
function getKeypoint(pose: Pose, name: KeypointName): Keypoint | undefined {
  return pose.keypoints.find((kp) => kp.name === name && kp.score >= MIN_CONFIDENCE);
}

/**
 * Pose Analysis Service for on-device fitness assessment
 */
export class PoseAnalysisService {
  private baselineAnkleY: number | null = null;
  private bodyHeight: number | null = null;

  /**
   * Reset baseline measurements (call before starting a new test)
   */
  resetBaseline(): void {
    this.baselineAnkleY = null;
    this.bodyHeight = null;
  }

  /**
   * Set baseline measurements from standing pose
   */
  setBaseline(pose: Pose): void {
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');
    const nose = getKeypoint(pose, 'nose');

    if (leftAnkle && rightAnkle) {
      this.baselineAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    }

    if (nose && leftAnkle) {
      this.bodyHeight = Math.abs(nose.y - leftAnkle.y);
    }
  }

  /**
   * Analyze pose for squat exercise
   */
  analyzeSquat(pose: Pose): {
    kneeAngle: number;
    hipAngle: number;
    isSquatPosition: boolean;
    isStandingPosition: boolean;
    formIssues: string[];
  } {
    const formIssues: string[] = [];

    // Get required keypoints
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');
    const leftShoulder = getKeypoint(pose, 'left_shoulder');
    const rightShoulder = getKeypoint(pose, 'right_shoulder');

    let kneeAngle = 180;
    let hipAngle = 180;

    // Calculate left knee angle (hip-knee-ankle)
    if (leftHip && leftKnee && leftAnkle) {
      kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    } else if (rightHip && rightKnee && rightAnkle) {
      kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    }

    // Calculate hip angle (shoulder-hip-knee)
    if (leftShoulder && leftHip && leftKnee) {
      hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    } else if (rightShoulder && rightHip && rightKnee) {
      hipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    }

    const isSquatPosition = kneeAngle <= EXERCISE_THRESHOLDS.squats.squatKneeAngle + 15;
    const isStandingPosition = kneeAngle >= EXERCISE_THRESHOLDS.squats.standingKneeAngle - 10;

    // Check form issues
    if (leftKnee && leftAnkle && leftKnee.x < leftAnkle.x - 30) {
      formIssues.push('Knees going too far forward');
    }

    if (hipAngle < 70) {
      formIssues.push('Keep chest up - too much forward lean');
    }

    return {
      kneeAngle,
      hipAngle,
      isSquatPosition,
      isStandingPosition,
      formIssues,
    };
  }

  /**
   * Analyze pose for push-up exercise
   */
  analyzePushup(pose: Pose): {
    elbowAngle: number;
    bodyAlignment: number;
    isDownPosition: boolean;
    isUpPosition: boolean;
    formIssues: string[];
  } {
    const formIssues: string[] = [];

    // Get required keypoints
    const leftShoulder = getKeypoint(pose, 'left_shoulder');
    const rightShoulder = getKeypoint(pose, 'right_shoulder');
    const leftElbow = getKeypoint(pose, 'left_elbow');
    const rightElbow = getKeypoint(pose, 'right_elbow');
    const leftWrist = getKeypoint(pose, 'left_wrist');
    const rightWrist = getKeypoint(pose, 'right_wrist');
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftAnkle = getKeypoint(pose, 'left_ankle');

    let elbowAngle = 180;
    let bodyAlignment = 180;

    // Calculate elbow angle (shoulder-elbow-wrist)
    if (leftShoulder && leftElbow && leftWrist) {
      elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    } else if (rightShoulder && rightElbow && rightWrist) {
      elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    }

    // Calculate body alignment (shoulder-hip-ankle)
    if (leftShoulder && leftHip && leftAnkle) {
      bodyAlignment = calculateAngle(leftShoulder, leftHip, leftAnkle);
    }

    const isDownPosition = elbowAngle <= EXERCISE_THRESHOLDS.pushups.downElbowAngle + 15;
    const isUpPosition = elbowAngle >= EXERCISE_THRESHOLDS.pushups.upElbowAngle - 15;

    // Check form issues
    if (bodyAlignment < 160 && leftHip && leftShoulder && leftHip.y < leftShoulder.y) {
      formIssues.push('Hips too high - maintain straight body line');
    } else if (bodyAlignment < 160 && leftHip && leftShoulder && leftHip.y > leftShoulder.y + 20) {
      formIssues.push('Hips sagging - engage core');
    }

    return {
      elbowAngle,
      bodyAlignment,
      isDownPosition,
      isUpPosition,
      formIssues,
    };
  }

  /**
   * Analyze pose for vertical jump
   */
  analyzeJump(pose: Pose): {
    currentHeight: number;
    jumpHeight: number;
    isInAir: boolean;
    formIssues: string[];
  } {
    const formIssues: string[] = [];

    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');

    let currentHeight = 0;
    let jumpHeight = 0;
    let isInAir = false;

    // Calculate current ankle height
    if (leftAnkle && rightAnkle) {
      currentHeight = (leftAnkle.y + rightAnkle.y) / 2;
    } else if (leftAnkle) {
      currentHeight = leftAnkle.y;
    } else if (rightAnkle) {
      currentHeight = rightAnkle.y;
    }

    // Calculate jump height relative to baseline
    if (this.baselineAnkleY !== null && this.bodyHeight !== null) {
      // In image coordinates, Y increases downward, so baseline - current = height
      jumpHeight = (this.baselineAnkleY - currentHeight) / this.bodyHeight;
      isInAir = jumpHeight > EXERCISE_THRESHOLDS.jump.jumpThreshold;
    }

    // Check form - knees should be together during jump
    if (leftKnee && rightKnee) {
      const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
      if (kneeDistance > 100) {
        formIssues.push('Keep knees together during jump');
      }
    }

    return {
      currentHeight,
      jumpHeight,
      isInAir,
      formIssues,
    };
  }

  /**
   * Analyze pose for sit-up exercise
   */
  analyzeSitup(pose: Pose): {
    hipAngle: number;
    isUpPosition: boolean;
    isDownPosition: boolean;
    formIssues: string[];
  } {
    const formIssues: string[] = [];

    // Get required keypoints
    const leftShoulder = getKeypoint(pose, 'left_shoulder');
    const rightShoulder = getKeypoint(pose, 'right_shoulder');
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');

    let hipAngle = 180;

    // Calculate hip angle (shoulder-hip-knee)
    if (leftShoulder && leftHip && leftKnee) {
      hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    } else if (rightShoulder && rightHip && rightKnee) {
      hipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    }

    const isUpPosition = hipAngle <= EXERCISE_THRESHOLDS.situps.upHipAngle + 20;
    const isDownPosition = hipAngle >= EXERCISE_THRESHOLDS.situps.downHipAngle - 10;

    // Check form issues
    if (leftKnee && rightKnee) {
      const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
      if (kneeDistance > 80) {
        formIssues.push('Keep knees together');
      }
    }

    // Check if torso is twisting
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipMidY = (leftHip.y + rightHip.y) / 2;
      const torsoAngle = Math.abs(leftShoulder.y - rightShoulder.y);
      
      if (torsoAngle > 30) {
        formIssues.push('Keep shoulders level - avoid twisting');
      }
    }

    return {
      hipAngle,
      isUpPosition,
      isDownPosition,
      formIssues,
    };
  }

  /**
   * Analyze pose for pull-up exercise
   */
  analyzePullup(pose: Pose): {
    elbowAngle: number;
    chinHeight: number;
    isUpPosition: boolean;
    isDownPosition: boolean;
    formIssues: string[];
  } {
    const formIssues: string[] = [];

    // Get required keypoints
    const nose = getKeypoint(pose, 'nose');
    const leftShoulder = getKeypoint(pose, 'left_shoulder');
    const rightShoulder = getKeypoint(pose, 'right_shoulder');
    const leftElbow = getKeypoint(pose, 'left_elbow');
    const rightElbow = getKeypoint(pose, 'right_elbow');
    const leftWrist = getKeypoint(pose, 'left_wrist');
    const rightWrist = getKeypoint(pose, 'right_wrist');
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');

    let elbowAngle = 180;
    let chinHeight = 0;

    // Calculate elbow angle (shoulder-elbow-wrist)
    if (leftShoulder && leftElbow && leftWrist) {
      elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    } else if (rightShoulder && rightElbow && rightWrist) {
      elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    }

    // Calculate chin height relative to wrists (bar position)
    if (nose && leftWrist && rightWrist) {
      const avgWristY = (leftWrist.y + rightWrist.y) / 2;
      if (this.bodyHeight !== null) {
        chinHeight = (avgWristY - nose.y) / this.bodyHeight;
      }
    }

    const isUpPosition = 
      elbowAngle <= EXERCISE_THRESHOLDS.pullups.upElbowAngle + 20 &&
      chinHeight >= EXERCISE_THRESHOLDS.pullups.chinAboveBarThreshold;
    const isDownPosition = elbowAngle >= EXERCISE_THRESHOLDS.pullups.downElbowAngle - 10;

    // Check form issues
    if (!isUpPosition && elbowAngle < 110 && chinHeight < EXERCISE_THRESHOLDS.pullups.chinAboveBarThreshold) {
      formIssues.push('Pull chin above bar level');
    }

    // Check body swing
    if (leftHip && rightHip && leftShoulder && rightShoulder) {
      const hipMidX = (leftHip.x + rightHip.x) / 2;
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
      const swingDistance = Math.abs(hipMidX - shoulderMidX);
      
      if (swingDistance > 60) {
        formIssues.push('Minimize body swing - use controlled motion');
      }
    }

    return {
      elbowAngle,
      chinHeight,
      isUpPosition,
      isDownPosition,
      formIssues,
    };
  }

  /**
   * Analyze pose for running exercise (cadence and speed estimation)
   */
  analyzeRunning(pose: Pose): {
    leftAnkleY: number;
    rightAnkleY: number;
    strideLength: number;
    legLength: number;
    formIssues: string[];
  } {
    const formIssues: string[] = [];

    // Get required keypoints
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');

    let leftAnkleY = 0;
    let rightAnkleY = 0;
    let legLength = 0;
    let strideLength = 0;

    // Get ankle positions
    if (leftAnkle) {
      leftAnkleY = leftAnkle.y;
    }
    if (rightAnkle) {
      rightAnkleY = rightAnkle.y;
    }

    // Calculate leg length (hip to ankle)
    if (leftHip && leftAnkle) {
      const leftLegLength = Math.sqrt(
        Math.pow(leftHip.x - leftAnkle.x, 2) + Math.pow(leftHip.y - leftAnkle.y, 2)
      );
      legLength = leftLegLength;
    } else if (rightHip && rightAnkle) {
      const rightLegLength = Math.sqrt(
        Math.pow(rightHip.x - rightAnkle.x, 2) + Math.pow(rightHip.y - rightAnkle.y, 2)
      );
      legLength = rightLegLength;
    }

    // Estimate stride length based on leg length (typical stride is 1.2-1.4x leg length)
    strideLength = legLength * 1.3;

    // Check running form
    if (leftKnee && leftHip && leftAnkle) {
      const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      if (kneeAngle < 140 && kneeAngle > 30) {
        // Knee is lifting - good form indicator
      }
    }

    return {
      leftAnkleY,
      rightAnkleY,
      strideLength,
      legLength,
      formIssues,
    };
  }

  /**
   * Check if pose has minimum required keypoints detected
   */
  hasSufficientKeypoints(pose: Pose, testType: FitnessTestType): boolean {
    const requiredKeypoints: Record<FitnessTestType, KeypointName[][]> = {
      squats: [['left_hip', 'right_hip'], ['left_knee', 'right_knee'], ['left_ankle', 'right_ankle']],
      pushups: [['left_shoulder', 'right_shoulder'], ['left_elbow', 'right_elbow'], ['left_wrist', 'right_wrist']],
      jump: [['left_ankle', 'right_ankle']],
      situps: [['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip'], ['left_knee', 'right_knee']],
      pullups: [['left_shoulder', 'right_shoulder'], ['left_elbow', 'right_elbow'], ['left_wrist', 'right_wrist']],
      running: [['left_hip', 'right_hip'], ['left_ankle', 'right_ankle']],
    };

    const required = requiredKeypoints[testType];
    return required.every((group: KeypointName[]) =>
      group.some((name: KeypointName) => getKeypoint(pose, name) !== undefined)
    );
  }

  /**
   * Generate feedback message based on form issues
   */
  generateFeedback(formIssues: string[], phase: ExercisePhase): string {
    if (formIssues.length > 0) {
      return formIssues[0]; // Return most important issue
    }

    switch (phase) {
      case 'idle':
        return 'Get ready to start';
      case 'starting':
        return 'Starting position detected';
      case 'down':
        return 'Good! Now push back up';
      case 'up':
        return 'Great form! Keep going';
      case 'completed':
        return 'Rep completed!';
      default:
        return '';
    }
  }

  /**
   * Calculate form score (0-100) based on issues detected
   */
  calculateFormScore(formIssues: string[]): number {
    const baseScore = 100;
    const penaltyPerIssue = 15;
    return Math.max(0, baseScore - formIssues.length * penaltyPerIssue);
  }
}

/**
 * Exercise state machine for tracking rep counting
 */
export class ExerciseTracker {
  private testType: FitnessTestType;
  private poseService: PoseAnalysisService;
  private state: ExerciseState;
  private repStartTime: number = 0;
  private repetitions: RepetitionData[] = [];
  private lastPhaseChangeTime: number = 0;
  private minPhaseDuration: number = 200; // Minimum ms between phase changes

  constructor(testType: FitnessTestType) {
    this.testType = testType;
    this.poseService = new PoseAnalysisService();
    this.state = {
      phase: 'idle',
      repCount: 0,
      formScore: 100,
      feedback: 'Get ready to start',
    };
  }

  /**
   * Reset tracker for new test
   */
  reset(): void {
    this.poseService.resetBaseline();
    this.state = {
      phase: 'idle',
      repCount: 0,
      formScore: 100,
      feedback: 'Get ready to start',
    };
    this.repetitions = [];
    this.repStartTime = 0;
    this.lastPhaseChangeTime = 0;
  }

  /**
   * Set baseline from standing pose
   */
  calibrate(pose: Pose): void {
    this.poseService.setBaseline(pose);
    this.state.phase = 'starting';
    this.state.feedback = 'Baseline set. Begin exercise!';
  }

  /**
   * Process a new pose frame and update state
   */
  processPose(pose: Pose): ExerciseState {
    if (!this.poseService.hasSufficientKeypoints(pose, this.testType)) {
      this.state.feedback = 'Position yourself so camera can see your full body';
      return { ...this.state };
    }

    const now = Date.now();
    const timeSinceLastChange = now - this.lastPhaseChangeTime;

    switch (this.testType) {
      case 'squats':
        this.processSquat(pose, now, timeSinceLastChange);
        break;
      case 'pushups':
        this.processPushup(pose, now, timeSinceLastChange);
        break;
      case 'jump':
        this.processJump(pose, now, timeSinceLastChange);
        break;
      case 'situps':
        this.processSitup(pose, now, timeSinceLastChange);
        break;
      case 'pullups':
        this.processPullup(pose, now, timeSinceLastChange);
        break;
      case 'running':
        this.processRunning(pose, now, timeSinceLastChange);
        break;
    }

    return { ...this.state };
  }

  private processSquat(pose: Pose, now: number, timeSinceLastChange: number): void {
    const analysis = this.poseService.analyzeSquat(pose);
    this.state.currentAngle = analysis.kneeAngle;

    const canChangePhase = timeSinceLastChange >= this.minPhaseDuration;

    if (this.state.phase === 'idle' || this.state.phase === 'starting') {
      if (analysis.isStandingPosition && canChangePhase) {
        this.state.phase = 'up';
        this.repStartTime = now;
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'up') {
      if (analysis.isSquatPosition && canChangePhase) {
        this.state.phase = 'down';
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'down') {
      if (analysis.isStandingPosition && canChangePhase) {
        this.completeRep(now, analysis.formIssues);
        this.state.phase = 'up';
        this.lastPhaseChangeTime = now;
        this.repStartTime = now;
      }
    }

    this.state.formScore = this.poseService.calculateFormScore(analysis.formIssues);
    this.state.feedback = this.poseService.generateFeedback(analysis.formIssues, this.state.phase);
  }

  private processPushup(pose: Pose, now: number, timeSinceLastChange: number): void {
    const analysis = this.poseService.analyzePushup(pose);
    this.state.currentAngle = analysis.elbowAngle;

    const canChangePhase = timeSinceLastChange >= this.minPhaseDuration;

    if (this.state.phase === 'idle' || this.state.phase === 'starting') {
      if (analysis.isUpPosition && canChangePhase) {
        this.state.phase = 'up';
        this.repStartTime = now;
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'up') {
      if (analysis.isDownPosition && canChangePhase) {
        this.state.phase = 'down';
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'down') {
      if (analysis.isUpPosition && canChangePhase) {
        this.completeRep(now, analysis.formIssues);
        this.state.phase = 'up';
        this.lastPhaseChangeTime = now;
        this.repStartTime = now;
      }
    }

    this.state.formScore = this.poseService.calculateFormScore(analysis.formIssues);
    this.state.feedback = this.poseService.generateFeedback(analysis.formIssues, this.state.phase);
  }

  private processJump(pose: Pose, now: number, timeSinceLastChange: number): void {
    const analysis = this.poseService.analyzeJump(pose);
    this.state.currentAngle = analysis.jumpHeight * 100; // Store as percentage

    const canChangePhase = timeSinceLastChange >= this.minPhaseDuration;

    if (this.state.phase === 'idle' || this.state.phase === 'starting') {
      if (!analysis.isInAir && canChangePhase) {
        this.state.phase = 'down'; // Ground position
        this.repStartTime = now;
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'down') {
      if (analysis.isInAir && canChangePhase) {
        this.state.phase = 'up'; // In air
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'up') {
      if (!analysis.isInAir && canChangePhase) {
        this.completeRep(now, analysis.formIssues);
        this.state.phase = 'down';
        this.lastPhaseChangeTime = now;
        this.repStartTime = now;
      }
    }

    this.state.formScore = this.poseService.calculateFormScore(analysis.formIssues);
    this.state.feedback = this.poseService.generateFeedback(analysis.formIssues, this.state.phase);
  }

  private processSitup(pose: Pose, now: number, timeSinceLastChange: number): void {
    const analysis = this.poseService.analyzeSitup(pose);
    this.state.currentAngle = analysis.hipAngle;

    const canChangePhase = timeSinceLastChange >= this.minPhaseDuration;

    if (this.state.phase === 'idle' || this.state.phase === 'starting') {
      if (analysis.isDownPosition && canChangePhase) {
        this.state.phase = 'down';
        this.repStartTime = now;
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'down') {
      if (analysis.isUpPosition && canChangePhase) {
        this.state.phase = 'up';
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'up') {
      if (analysis.isDownPosition && canChangePhase) {
        this.completeRep(now, analysis.formIssues);
        this.state.phase = 'down';
        this.lastPhaseChangeTime = now;
        this.repStartTime = now;
      }
    }

    this.state.formScore = this.poseService.calculateFormScore(analysis.formIssues);
    this.state.feedback = this.poseService.generateFeedback(analysis.formIssues, this.state.phase);
  }

  private processPullup(pose: Pose, now: number, timeSinceLastChange: number): void {
    const analysis = this.poseService.analyzePullup(pose);
    this.state.currentAngle = analysis.elbowAngle;

    const canChangePhase = timeSinceLastChange >= this.minPhaseDuration;

    if (this.state.phase === 'idle' || this.state.phase === 'starting') {
      if (analysis.isDownPosition && canChangePhase) {
        this.state.phase = 'down';
        this.repStartTime = now;
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'down') {
      if (analysis.isUpPosition && canChangePhase) {
        this.state.phase = 'up';
        this.lastPhaseChangeTime = now;
      }
    } else if (this.state.phase === 'up') {
      if (analysis.isDownPosition && canChangePhase) {
        this.completeRep(now, analysis.formIssues);
        this.state.phase = 'down';
        this.lastPhaseChangeTime = now;
        this.repStartTime = now;
      }
    }

    this.state.formScore = this.poseService.calculateFormScore(analysis.formIssues);
    this.state.feedback = this.poseService.generateFeedback(analysis.formIssues, this.state.phase);
  }

  // Running tracker state
  private runningSteps: number = 0;
  private lastStepTime: number = 0;
  private leftAnkleHistory: number[] = [];
  private rightAnkleHistory: number[] = [];
  private cadenceReadings: number[] = [];
  private runningDistance: number = 0;

  private processRunning(pose: Pose, now: number, timeSinceLastChange: number): void {
    const analysis = this.poseService.analyzeRunning(pose);

    // Track ankle positions over time for step detection
    this.leftAnkleHistory.push(analysis.leftAnkleY);
    this.rightAnkleHistory.push(analysis.rightAnkleY);

    // Keep only last 10 frames
    if (this.leftAnkleHistory.length > 10) {
      this.leftAnkleHistory.shift();
    }
    if (this.rightAnkleHistory.length > 10) {
      this.rightAnkleHistory.shift();
    }

    // Detect steps by finding ankle lift peaks
    if (this.leftAnkleHistory.length >= 5) {
      const recentLeft = this.leftAnkleHistory.slice(-5);
      const recentRight = this.rightAnkleHistory.slice(-5);
      
      // Check if left ankle just lifted (Y decreased, meaning ankle moved up)
      const leftLifted = recentLeft[2] < recentLeft[0] - 10 && recentLeft[2] < recentLeft[4] - 5;
      // Check if right ankle just lifted
      const rightLifted = recentRight[2] < recentRight[0] - 10 && recentRight[2] < recentRight[4] - 5;

      const timeSinceLastStep = now - this.lastStepTime;

      if ((leftLifted || rightLifted) && timeSinceLastStep > 200) {
        // Step detected
        this.runningSteps++;
        this.lastStepTime = now;

        // Calculate cadence (steps per minute)
        if (this.runningSteps > 1) {
          const cadence = 60000 / timeSinceLastStep; // Convert ms to steps per minute
          this.cadenceReadings.push(cadence);
          
          // Keep only last 10 cadence readings
          if (this.cadenceReadings.length > 10) {
            this.cadenceReadings.shift();
          }
        }

        // Estimate distance covered (stride length in normalized units * step count)
        // Convert to approximate meters (assuming average body height ~1.7m)
        const strideInMeters = (analysis.strideLength / 500) * 1.7; // Normalize and scale
        this.runningDistance += strideInMeters / 2; // Divide by 2 as each stride = 2 steps

        this.state.repCount = this.runningSteps;
        this.state.feedback = `${this.runningSteps} steps`;
      }
    }

    // Calculate average cadence
    let avgCadence = 0;
    if (this.cadenceReadings.length > 0) {
      avgCadence = this.cadenceReadings.reduce((a, b) => a + b, 0) / this.cadenceReadings.length;
    }

    this.state.currentAngle = avgCadence; // Store cadence in currentAngle field for display
    this.state.formScore = this.poseService.calculateFormScore(analysis.formIssues);
  }

  /**
   * Get running-specific data
   */
  getRunningData(): {
    totalSteps: number;
    avgCadence: number;
    distance: number;
    avgSpeed: number;
  } {
    const avgCadence = this.cadenceReadings.length > 0
      ? this.cadenceReadings.reduce((a, b) => a + b, 0) / this.cadenceReadings.length
      : 0;

    // Calculate average speed (m/s) based on distance and time
    const totalTime = (Date.now() - (this.lastPhaseChangeTime || Date.now())) / 1000;
    const avgSpeed = totalTime > 0 ? this.runningDistance / totalTime : 0;

    return {
      totalSteps: this.runningSteps,
      avgCadence,
      distance: this.runningDistance,
      avgSpeed,
    };
  }

  private completeRep(now: number, formIssues: string[]): void {
    const duration = now - this.repStartTime;
    const formScore = this.poseService.calculateFormScore(formIssues);

    this.repetitions.push({
      startTime: this.repStartTime,
      endTime: now,
      duration,
      formScore,
      issues: [...formIssues],
    });

    this.state.repCount++;
    this.state.feedback = `Rep ${this.state.repCount} complete!`;
  }

  /**
   * Get completed repetitions data
   */
  getRepetitions(): RepetitionData[] {
    return [...this.repetitions];
  }

  /**
   * Get current state
   */
  getState(): ExerciseState {
    return { ...this.state };
  }
}
