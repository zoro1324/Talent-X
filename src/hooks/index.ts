/**
 * Custom hooks for the Talent-X app
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageService } from '../services/StorageService';
import { ExerciseTracker } from '../services/PoseAnalysisService';
import type {
  AthleteProfile,
  TestResult,
  AppSettings,
  FitnessTestType,
  ExerciseState,
  Pose,
} from '../types';

/**
 * Hook for managing athletes
 */
export function useAthletes() {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAthletes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await StorageService.getAthletes();
      setAthletes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load athletes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  const saveAthlete = useCallback(async (athlete: AthleteProfile) => {
    await StorageService.saveAthlete(athlete);
    await loadAthletes();
  }, [loadAthletes]);

  const deleteAthlete = useCallback(async (id: string) => {
    await StorageService.deleteAthlete(id);
    await loadAthletes();
  }, [loadAthletes]);

  return {
    athletes,
    loading,
    error,
    refresh: loadAthletes,
    saveAthlete,
    deleteAthlete,
  };
}

/**
 * Hook for managing a single athlete
 */
export function useAthlete(athleteId: string | undefined) {
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAthlete() {
      if (!athleteId) {
        setAthlete(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await StorageService.getAthleteById(athleteId);
        setAthlete(data);
        setError(null);
      } catch (err) {
        setError('Failed to load athlete');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAthlete();
  }, [athleteId]);

  return { athlete, loading, error };
}

/**
 * Hook for managing test results
 */
export function useTestResults(athleteId?: string) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const data = athleteId
        ? await StorageService.getTestResultsByAthlete(athleteId)
        : await StorageService.getTestResults();
      setResults(data);
      setError(null);
    } catch (err) {
      setError('Failed to load test results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const saveResult = useCallback(async (result: TestResult) => {
    await StorageService.saveTestResult(result);
    await loadResults();
  }, [loadResults]);

  const deleteResult = useCallback(async (id: string) => {
    await StorageService.deleteTestResult(id);
    await loadResults();
  }, [loadResults]);

  return {
    results,
    loading,
    error,
    refresh: loadResults,
    saveResult,
    deleteResult,
  };
}

/**
 * Hook for app settings
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await StorageService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    await StorageService.updateSettings(newSettings);
    const updated = await StorageService.getSettings();
    setSettings(updated);
  }, []);

  return { settings, loading, updateSettings };
}

/**
 * Hook for exercise tracking during a test
 */
export function useExerciseTracker(testType: FitnessTestType) {
  const trackerRef = useRef<ExerciseTracker | null>(null);
  const [state, setState] = useState<ExerciseState>({
    phase: 'idle',
    repCount: 0,
    formScore: 100,
    feedback: 'Get ready to start',
  });
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    trackerRef.current = new ExerciseTracker(testType);
    return () => {
      trackerRef.current = null;
    };
  }, [testType]);

  const calibrate = useCallback((pose: Pose) => {
    if (trackerRef.current) {
      trackerRef.current.calibrate(pose);
      setIsCalibrated(true);
      setState(trackerRef.current.getState());
    }
  }, []);

  const processPose = useCallback((pose: Pose) => {
    if (trackerRef.current && isCalibrated) {
      const newState = trackerRef.current.processPose(pose);
      setState(newState);
      return newState;
    }
    return state;
  }, [isCalibrated, state]);

  const reset = useCallback(() => {
    if (trackerRef.current) {
      trackerRef.current.reset();
      setState(trackerRef.current.getState());
      setIsCalibrated(false);
    }
  }, []);

  const getRepetitions = useCallback(() => {
    return trackerRef.current?.getRepetitions() || [];
  }, []);

  return {
    state,
    isCalibrated,
    calibrate,
    processPose,
    reset,
    getRepetitions,
  };
}

/**
 * Hook for countdown timer
 */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds]);

  return {
    seconds,
    isRunning,
    isComplete: seconds === 0,
    start,
    pause,
    reset,
    setSeconds,
  };
}
