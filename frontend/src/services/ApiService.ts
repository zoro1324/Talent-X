/**
 * API Service for communicating with the Talent-X backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

// Base URL for API
const API_BASE_URL = API_CONFIG.BASE_URL;

// Storage key for auth token
const AUTH_TOKEN_KEY = '@talent_x_auth_token';

/**
 * Sport category from API
 */
export interface SportCategory {
  id: string;
  name: string;
  icon: string;
  color: string[];
  image: string;
  description?: string;
  athletes: number;
}

/**
 * Exercise from API
 */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  videoUrl?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  benefits: string[];
  calories: number;
  sets?: number;
  reps?: number;
}

/**
 * Sport with exercises response
 */
export interface SportExercisesResponse {
  sport: {
    id: string;
    name: string;
    icon: string;
    color: string[];
    image: string;
  };
  exercises: Exercise[];
  total: number;
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * API Service class
 */
export class ApiService {
  private static baseUrl = API_BASE_URL;

  /**
   * Set the base URL for API calls
   */
  static setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get the stored auth token
   */
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Store auth token
   */
  static async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  /**
   * Clear auth token
   */
  static async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /**
   * Make an API request
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'API request failed');
    }

    return data.data as T;
  }

  /**
   * GET request
   */
  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  static async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============ Sports API ============

  /**
   * Get all sports categories
   */
  static async getSports(): Promise<SportCategory[]> {
    return this.get<SportCategory[]>('/sports');
  }

  /**
   * Get a single sport by ID
   */
  static async getSport(id: string): Promise<SportCategory & { exercises: Exercise[] }> {
    return this.get<SportCategory & { exercises: Exercise[] }>(`/sports/${id}`);
  }

  /**
   * Get exercises for a specific sport
   */
  static async getSportExercises(
    sportId: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<SportExercisesResponse> {
    const query = difficulty ? `?difficulty=${difficulty}` : '';
    return this.get<SportExercisesResponse>(`/sports/${sportId}/exercises${query}`);
  }

  /**
   * Seed initial sports data
   */
  static async seedSportsData(): Promise<{ sportsCreated: number; exercisesCreated: number }> {
    return this.post<{ sportsCreated: number; exercisesCreated: number }>('/sports/seed');
  }

  // ============ Athletes API ============

  /**
   * Get all athletes for current user
   */
  static async getAthletes(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<unknown[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.get<unknown[]>(`/athletes${query}`);
  }

  /**
   * Get athlete by ID
   */
  static async getAthlete(id: string): Promise<unknown> {
    return this.get<unknown>(`/athletes/${id}`);
  }

  /**
   * Create a new athlete
   */
  static async createAthlete(data: unknown): Promise<unknown> {
    return this.post<unknown>('/athletes', data);
  }

  /**
   * Update athlete
   */
  static async updateAthlete(id: string, data: unknown): Promise<unknown> {
    return this.put<unknown>(`/athletes/${id}`, data);
  }

  /**
   * Delete athlete
   */
  static async deleteAthlete(id: string): Promise<void> {
    return this.delete<void>(`/athletes/${id}`);
  }

  // ============ Test Results API ============

  /**
   * Get test results
   */
  static async getTestResults(): Promise<unknown[]> {
    return this.get<unknown[]>('/tests');
  }

  /**
   * Get test result by ID
   */
  static async getTestResult(id: string): Promise<unknown> {
    return this.get<unknown>(`/tests/${id}`);
  }

  /**
   * Create test result
   */
  static async createTestResult(data: unknown): Promise<unknown> {
    return this.post<unknown>('/tests', data);
  }

  /**
   * Get athlete test history
   */
  static async getAthleteTestHistory(athleteId: string): Promise<unknown[]> {
    return this.get<unknown[]>(`/tests/athlete/${athleteId}/history`);
  }

  /**
   * Get leaderboard for a test type
   */
  static async getLeaderboard(testType: string): Promise<unknown[]> {
    return this.get<unknown[]>(`/tests/leaderboard/${testType}`);
  }

  // ============ Auth API ============

  /**
   * Login
   */
  static async login(email: string, password: string): Promise<{ token: string; user: unknown }> {
    const response = await this.post<{ token: string; user: unknown }>('/auth/login', {
      email,
      password,
    });
    if (response.token) {
      await this.setToken(response.token);
    }
    return response;
  }

  /**
   * Register
   */
  static async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ token: string; refreshToken: string; user: any }> {
    const response = await this.post<{ data: { token: string; refreshToken: string; user: any } }>('/auth/register', data);
    
    // Store token if provided
    if (response.data?.token) {
      await this.setToken(response.data.token);
    }
    
    return response.data;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<unknown> {
    return this.get<unknown>('/auth/me');
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    await this.clearToken();
  }

  // ============ Dashboard API ============

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    totalAthletes: string;
    testsToday: string;
    activeSports: string;
    avgScore: string;
    trends: {
      athletes: string;
      tests: string;
      sports: string;
      score: string;
    };
  }> {
    return this.get('/dashboard/stats');
  }

  /**
   * Get achievements/top performers
   */
  static async getAchievements(limit?: number): Promise<Array<{
    id: string;
    title: string;
    athlete: string;
    sport: string;
    score: number;
  }>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.get(`/dashboard/achievements${query}`);
  }

  /**
   * Get segmented leaderboard
   */
  static async getSegmentedLeaderboard(filters?: {
    sport?: string;
    ageGroup?: 'U12' | 'U14' | 'U16' | 'U18' | 'U20' | 'adult';
    school?: string;
    club?: string;
    testType?: string;
    limit?: number;
  }): Promise<{
    data: Array<{
      rank: number;
      athlete: {
        id: number;
        name: string;
        sport: string;
        school: string | null;
        club: string | null;
        age: number;
      };
      score: number;
      testType: string;
      formScore: number;
      totalTests: number;
      lastUpdated: string;
    }>;
    filters: unknown;
    totalEntries: number;
  }> {
    const queryParams = new URLSearchParams();
    if (filters?.sport) queryParams.append('sport', filters.sport);
    if (filters?.ageGroup) queryParams.append('ageGroup', filters.ageGroup);
    if (filters?.school) queryParams.append('school', filters.school);
    if (filters?.club) queryParams.append('club', filters.club);
    if (filters?.testType) queryParams.append('testType', filters.testType);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.get(`/dashboard/leaderboard${query}`);
  }

  // ============ Training Plans API ============

  /**
   * Generate a new training plan
   */
  static async generatePlan(data: {
    athleteId: number;
    sport: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    weeklyVolume?: number;
    userAvailability?: number[]; // Days of week (1-7)
  }): Promise<{ message: string; plan: unknown }> {
    return this.post('/plans/generate', data);
  }

  /**
   * Adapt existing plan based on performance
   */
  static async adaptPlan(planId: number): Promise<{
    message: string;
    plan: unknown;
    adaptationSummary: {
      trend: 'improving' | 'stable' | 'declining';
      volumeChange: number;
      intensityChange: number;
    };
  }> {
    return this.put(`/plans/${planId}/adapt`);
  }

  /**
   * Get athlete's active training plan
   */
  static async getActivePlan(athleteId: number): Promise<{ plan: unknown }> {
    return this.get(`/plans/athlete/${athleteId}/active`);
  }

  /**
   * Mark workout as completed
   */
  static async completeWorkout(workoutId: number): Promise<{ message: string; workout: unknown }> {
    return this.put(`/plans/workout/${workoutId}/complete`);
  }
}

