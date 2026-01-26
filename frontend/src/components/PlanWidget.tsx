/**
 * Plan Widget - displays current training plan summary
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiService } from '../services';

interface PlanWidgetProps {
  athleteId: string;
  onPlanPress?: () => void;
  onAdaptPress?: () => void;
}

interface Workout {
  id: number;
  title: string;
  completed: boolean;
  estimatedDuration: number;
  dayNumber: number;
}

export function PlanWidget({ athleteId, onPlanPress, onAdaptPress }: PlanWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadPlan();
  }, [athleteId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getActivePlan(parseInt(athleteId)) as any;
      setPlan(response.plan);

      // Get current week number
      const now = new Date();
      const startDate = new Date(response.plan.startDate);
      const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const currentWeek = weeksPassed + 1;

      // Filter workouts for current week
      const thisWeekWorkouts = response.plan.workouts.filter(
        (w: any) => w.weekNumber === currentWeek
      );
      setWeekWorkouts(thisWeekWorkouts);
    } catch (error) {
      console.log('No active plan found');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWorkout = async (workoutId: number) => {
    try {
      await ApiService.completeWorkout(workoutId);
      loadPlan(); // Refresh
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  if (!plan) {
    return (
      <TouchableOpacity style={styles.noPlanCard} onPress={onPlanPress}>
        <Text style={styles.noPlanIcon}>📋</Text>
        <Text style={styles.noPlanTitle}>No Training Plan</Text>
        <Text style={styles.noPlanText}>
          Tap to generate a personalized training plan
        </Text>
      </TouchableOpacity>
    );
  }

  const completedCount = weekWorkouts.filter(w => w.completed).length;
  const progress = weekWorkouts.length > 0 ? (completedCount / weekWorkouts.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.planCard}
      >
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planTitle}>🎯 This Week's Plan</Text>
            <Text style={styles.planSport}>{plan.sport} • {plan.difficulty}</Text>
          </View>
          <TouchableOpacity style={styles.adaptBtn} onPress={onAdaptPress}>
            <Text style={styles.adaptBtnText}>Adapt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{weekWorkouts.length} workouts completed
          </Text>
        </View>

        <View style={styles.workoutsList}>
          {weekWorkouts.slice(0, 3).map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.workoutItem}
              onPress={() => !workout.completed && handleCompleteWorkout(workout.id)}
            >
              <View style={styles.workoutCheck}>
                <Text style={styles.checkIcon}>
                  {workout.completed ? '✓' : '○'}
                </Text>
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{workout.title}</Text>
                <Text style={styles.workoutDuration}>
                  {workout.estimatedDuration} min
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {weekWorkouts.length > 3 && (
          <TouchableOpacity style={styles.viewAllBtn} onPress={onPlanPress}>
            <Text style={styles.viewAllText}>
              View all {weekWorkouts.length} workouts →
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  noPlanCard: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noPlanIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  noPlanText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planSport: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  adaptBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adaptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  workoutsList: {
    marginBottom: 12,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  workoutCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  workoutDuration: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
