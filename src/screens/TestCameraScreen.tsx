/**
 * Test camera screen - performs the actual fitness test with on-device AI
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Loading } from '../components';
import { useAthlete, useTestResults, useExerciseTracker, useCountdown } from '../hooks';
import { ScoringService } from '../services';
import { generateId, formatDuration, getTestDisplayName } from '../utils';
import type { RootStackParamList, Pose, TestResult } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TestCamera'>;

type TestPhase = 'setup' | 'calibrating' | 'countdown' | 'testing' | 'complete';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_WIDTH * 1.3;

export function TestCameraScreen({ navigation, route }: Props) {
  const { athleteId, testType } = route.params;
  const { athlete } = useAthlete(athleteId);
  const { saveResult } = useTestResults(athleteId);
  const testInfo = ScoringService.getTestInfo(testType);

  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<TestPhase>('setup');
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const testStartTime = useRef<Date | null>(null);

  const exerciseTracker = useExerciseTracker(testType);
  const countdown = useCountdown(testInfo.duration);

  // Simulated pose for demo - in production, integrate with TensorFlow.js
  const generateSimulatedPose = useCallback((): Pose => {
    // Generate simulated keypoints for demo purposes
    // In production, this would come from TensorFlow.js pose detection
    const baseY = 300;
    const time = Date.now() / 1000;
    const movement = Math.sin(time * 2) * 50;

    return {
      score: 0.9,
      keypoints: [
        { name: 'nose', x: 200, y: baseY - 200 + movement * 0.2, score: 0.95 },
        { name: 'left_shoulder', x: 160, y: baseY - 150 + movement * 0.3, score: 0.9 },
        { name: 'right_shoulder', x: 240, y: baseY - 150 + movement * 0.3, score: 0.9 },
        { name: 'left_elbow', x: 120, y: baseY - 80 + movement * 0.4, score: 0.85 },
        { name: 'right_elbow', x: 280, y: baseY - 80 + movement * 0.4, score: 0.85 },
        { name: 'left_wrist', x: 100, y: baseY - 20 + movement * 0.5, score: 0.8 },
        { name: 'right_wrist', x: 300, y: baseY - 20 + movement * 0.5, score: 0.8 },
        { name: 'left_hip', x: 170, y: baseY + movement * 0.6, score: 0.9 },
        { name: 'right_hip', x: 230, y: baseY + movement * 0.6, score: 0.9 },
        { name: 'left_knee', x: 160, y: baseY + 100 + movement, score: 0.85 },
        { name: 'right_knee', x: 240, y: baseY + 100 + movement, score: 0.85 },
        { name: 'left_ankle', x: 150, y: baseY + 200 + movement * 0.8, score: 0.8 },
        { name: 'right_ankle', x: 250, y: baseY + 200 + movement * 0.8, score: 0.8 },
        { name: 'left_eye', x: 190, y: baseY - 210 + movement * 0.2, score: 0.9 },
        { name: 'right_eye', x: 210, y: baseY - 210 + movement * 0.2, score: 0.9 },
        { name: 'left_ear', x: 175, y: baseY - 200 + movement * 0.2, score: 0.85 },
        { name: 'right_ear', x: 225, y: baseY - 200 + movement * 0.2, score: 0.85 },
      ],
    };
  }, []);

  // Process poses during testing phase
  useEffect(() => {
    if (phase !== 'testing') return;

    const interval = setInterval(() => {
      const pose = generateSimulatedPose();
      exerciseTracker.processPose(pose);
    }, 100); // 10 FPS for pose processing

    return () => clearInterval(interval);
  }, [phase, exerciseTracker, generateSimulatedPose]);

  // Handle countdown completion
  useEffect(() => {
    if (countdown.isComplete && phase === 'testing') {
      handleTestComplete();
    }
  }, [countdown.isComplete, phase]);

  const handleStartSetup = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access to perform fitness tests.'
        );
        return;
      }
    }
    setPhase('calibrating');
  };

  const handleCalibrate = () => {
    const pose = generateSimulatedPose();
    exerciseTracker.calibrate(pose);
    setPhase('countdown');

    // Start countdown after 3 seconds
    setTimeout(() => {
      setPhase('testing');
      testStartTime.current = new Date();
      countdown.start();
    }, 3000);
  };

  const handleTestComplete = useCallback(async () => {
    if (phase === 'complete') return;
    
    setPhase('complete');
    countdown.pause();

    if (!athlete || !testStartTime.current) return;

    const now = new Date();
    const duration = Math.round((now.getTime() - testStartTime.current.getTime()) / 1000);
    const repetitions = exerciseTracker.getRepetitions();
    const totalReps = exerciseTracker.state.repCount;

    // Calculate score
    const score = ScoringService.calculateScore(
      testType,
      totalReps,
      repetitions,
      athlete.gender,
      athlete.dateOfBirth
    );

    // Calculate average form score
    const averageFormScore =
      repetitions.length > 0
        ? repetitions.reduce((sum, r) => sum + r.formScore, 0) / repetitions.length
        : 100;

    // Create result
    const result: TestResult = {
      id: generateId(),
      athleteId,
      testType,
      startedAt: testStartTime.current.toISOString(),
      completedAt: now.toISOString(),
      duration,
      repetitions,
      totalReps,
      score,
      averageFormScore,
      createdAt: now.toISOString(),
    };

    try {
      await saveResult(result);
      navigation.replace('TestResult', { resultId: result.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to save test result');
      navigation.goBack();
    }
  }, [phase, athlete, testType, athleteId, exerciseTracker, countdown, saveResult, navigation]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Test',
      'Are you sure you want to cancel this test?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (!permission) {
    return <Loading message="Checking camera permissions..." />;
  }

  if (!permission.granted && phase === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to analyze your exercise form and count repetitions.
            All processing happens on your device - no video is uploaded.
          </Text>
          <Button
            title="Grant Camera Access"
            onPress={handleStartSetup}
            size="large"
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top info bar */}
          <View style={styles.topBar}>
            <Text style={styles.testName}>{getTestDisplayName(testType)}</Text>
            {phase === 'testing' && (
              <Text style={styles.timer}>{formatDuration(countdown.seconds)}</Text>
            )}
          </View>

          {/* Center feedback */}
          {phase === 'testing' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.repCount}>{exerciseTracker.state.repCount}</Text>
              <Text style={styles.repLabel}>reps</Text>
              <Text style={styles.feedback}>{exerciseTracker.state.feedback}</Text>
            </View>
          )}

          {/* Calibration UI */}
          {phase === 'calibrating' && (
            <View style={styles.calibrationContainer}>
              <Text style={styles.calibrationText}>
                Position yourself so your full body is visible
              </Text>
              <Button
                title="I'm Ready"
                onPress={handleCalibrate}
                size="large"
                style={styles.calibrateButton}
              />
            </View>
          )}

          {/* Countdown UI */}
          {phase === 'countdown' && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>Get Ready!</Text>
              <Text style={styles.countdownNumber}>3</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {phase === 'setup' && (
          <Card style={styles.setupCard}>
            <Text style={styles.setupTitle}>{testInfo.name}</Text>
            <Text style={styles.setupDescription}>{testInfo.description}</Text>
            <Text style={styles.setupDuration}>
              Duration: {testInfo.duration} seconds
            </Text>
            <View style={styles.setupButtons}>
              <Button
                title="Cancel"
                onPress={() => navigation.goBack()}
                variant="outline"
                style={styles.setupButton}
              />
              <Button
                title="Start"
                onPress={handleStartSetup}
                style={styles.setupButton}
              />
            </View>
          </Card>
        )}

        {phase === 'testing' && (
          <View style={styles.testingControls}>
            <View style={styles.formScore}>
              <Text style={styles.formScoreLabel}>Form Score</Text>
              <Text style={styles.formScoreValue}>
                {exerciseTracker.state.formScore}%
              </Text>
            </View>
            <Button
              title="End Test"
              onPress={handleTestComplete}
              variant="danger"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    height: CAMERA_HEIGHT,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 12,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  timer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  feedbackContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 16,
  },
  repCount: {
    fontSize: 72,
    fontWeight: '700',
    color: '#ffffff',
  },
  repLabel: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: -8,
  },
  feedback: {
    fontSize: 16,
    color: '#fbbf24',
    marginTop: 12,
    textAlign: 'center',
  },
  calibrationContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 16,
  },
  calibrationText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  calibrateButton: {
    minWidth: 160,
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 32,
    borderRadius: 16,
  },
  countdownText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: '700',
    color: '#3b82f6',
  },
  controls: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  setupCard: {
    flex: 1,
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  setupDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  setupDuration: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  setupButton: {
    flex: 1,
  },
  testingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
  },
  formScore: {
    alignItems: 'center',
  },
  formScoreLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  formScoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    minWidth: 240,
  },
});
