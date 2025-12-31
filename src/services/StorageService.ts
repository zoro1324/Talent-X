/**
 * Offline storage service using AsyncStorage
 * Provides persistent local storage for athletes, test results, and settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AthleteProfile,
  TestResult,
  AppSettings,
} from '../types';

const STORAGE_KEYS = {
  ATHLETES: '@talent_x_athletes',
  TEST_RESULTS: '@talent_x_results',
  SETTINGS: '@talent_x_settings',
} as const;

/** Default app settings */
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  soundEnabled: true,
  vibrationEnabled: true,
  showFormGuides: true,
  testDuration: 60, // 60 seconds default
  lowPowerMode: false,
};

/**
 * Storage service for offline data persistence
 */
export class StorageService {
  // ============ Athletes ============

  /**
   * Get all stored athlete profiles
   */
  static async getAthletes(): Promise<AthleteProfile[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATHLETES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting athletes:', error);
      return [];
    }
  }

  /**
   * Get a single athlete by ID
   */
  static async getAthleteById(id: string): Promise<AthleteProfile | null> {
    const athletes = await this.getAthletes();
    return athletes.find((a) => a.id === id) || null;
  }

  /**
   * Save a new athlete profile
   */
  static async saveAthlete(athlete: AthleteProfile): Promise<void> {
    try {
      const athletes = await this.getAthletes();
      const existingIndex = athletes.findIndex((a) => a.id === athlete.id);
      
      if (existingIndex >= 0) {
        athletes[existingIndex] = {
          ...athlete,
          updatedAt: new Date().toISOString(),
        };
      } else {
        athletes.push(athlete);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.ATHLETES, JSON.stringify(athletes));
    } catch (error) {
      console.error('Error saving athlete:', error);
      throw new Error('Failed to save athlete profile');
    }
  }

  /**
   * Delete an athlete profile and their test results
   */
  static async deleteAthlete(id: string): Promise<void> {
    try {
      const athletes = await this.getAthletes();
      const filteredAthletes = athletes.filter((a) => a.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ATHLETES, JSON.stringify(filteredAthletes));
      
      // Also delete associated test results
      const results = await this.getTestResults();
      const filteredResults = results.filter((r) => r.athleteId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(filteredResults));
    } catch (error) {
      console.error('Error deleting athlete:', error);
      throw new Error('Failed to delete athlete profile');
    }
  }

  // ============ Test Results ============

  /**
   * Get all test results
   */
  static async getTestResults(): Promise<TestResult[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting test results:', error);
      return [];
    }
  }

  /**
   * Get test results for a specific athlete
   */
  static async getTestResultsByAthlete(athleteId: string): Promise<TestResult[]> {
    const results = await this.getTestResults();
    return results
      .filter((r) => r.athleteId === athleteId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  /**
   * Get a single test result by ID
   */
  static async getTestResultById(id: string): Promise<TestResult | null> {
    const results = await this.getTestResults();
    return results.find((r) => r.id === id) || null;
  }

  /**
   * Save a new test result
   */
  static async saveTestResult(result: TestResult): Promise<void> {
    try {
      const results = await this.getTestResults();
      results.push(result);
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(results));
    } catch (error) {
      console.error('Error saving test result:', error);
      throw new Error('Failed to save test result');
    }
  }

  /**
   * Delete a test result
   */
  static async deleteTestResult(id: string): Promise<void> {
    try {
      const results = await this.getTestResults();
      const filteredResults = results.filter((r) => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(filteredResults));
    } catch (error) {
      console.error('Error deleting test result:', error);
      throw new Error('Failed to delete test result');
    }
  }

  // ============ Settings ============

  /**
   * Get app settings
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update app settings
   */
  static async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  // ============ Utility ============

  /**
   * Clear all stored data (for debugging/reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ATHLETES,
        STORAGE_KEYS.TEST_RESULTS,
        STORAGE_KEYS.SETTINGS,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    athleteCount: number;
    testResultCount: number;
  }> {
    const athletes = await this.getAthletes();
    const results = await this.getTestResults();
    return {
      athleteCount: athletes.length,
      testResultCount: results.length,
    };
  }
}
