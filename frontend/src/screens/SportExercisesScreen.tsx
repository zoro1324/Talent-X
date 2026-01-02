/**
 * Sport Exercises Screen - displays exercises for a selected sport
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { ApiService, Exercise, SportExercisesResponse } from '../services';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SportExercises'>;

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const difficultyColors = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function SportExercisesScreen({ navigation, route }: Props) {
  const { sportId, sportName, sportIcon, sportColor } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SportExercisesResponse | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const loadExercises = useCallback(async (difficulty?: DifficultyFilter) => {
    try {
      setError(null);
      const difficultyParam = difficulty === 'all' ? undefined : difficulty;
      const response = await ApiService.getSportExercises(sportId, difficultyParam);
      setData(response);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sportId]);

  useEffect(() => {
    loadExercises(selectedDifficulty);
  }, [loadExercises, selectedDifficulty]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadExercises(selectedDifficulty);
  };

  const handleDifficultyChange = (difficulty: DifficultyFilter) => {
    setSelectedDifficulty(difficulty);
    setLoading(true);
  };

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const renderDifficultyFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map((level) => (
        <TouchableOpacity
          key={level}
          style={[
            styles.filterButton,
            selectedDifficulty === level && styles.filterButtonActive,
            selectedDifficulty === level && level !== 'all' && {
              backgroundColor: difficultyColors[level as keyof typeof difficultyColors],
            },
          ]}
          onPress={() => handleDifficultyChange(level)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedDifficulty === level && styles.filterButtonTextActive,
            ]}
          >
            {level === 'all' ? 'All Levels' : difficultyLabels[level as keyof typeof difficultyLabels]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderExerciseCard = ({ item }: { item: Exercise }) => {
    const isExpanded = expandedExercise === item.id;
    
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => toggleExercise(item.id)}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseIconContainer}>
            <Text style={styles.exerciseIcon}>{item.icon}</Text>
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.exerciseMeta}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: difficultyColors[item.difficulty] + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: difficultyColors[item.difficulty] },
                  ]}
                >
                  {difficultyLabels[item.difficulty]}
                </Text>
              </View>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
              </View>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#9ca3af"
          />
        </View>

        {/* Description */}
        <Text style={styles.exerciseDescription} numberOfLines={isExpanded ? undefined : 2}>
          {item.description}
        </Text>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Image */}
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.exerciseImage} />
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame-outline" size={18} color="#f59e0b" />
                <Text style={styles.statValue}>{item.calories}</Text>
                <Text style={styles.statLabel}>calories</Text>
              </View>
              {item.sets && (
                <View style={styles.statItem}>
                  <Ionicons name="repeat-outline" size={18} color="#3b82f6" />
                  <Text style={styles.statValue}>{item.sets}</Text>
                  <Text style={styles.statLabel}>sets</Text>
                </View>
              )}
              {item.reps && (
                <View style={styles.statItem}>
                  <Ionicons name="fitness-outline" size={18} color="#10b981" />
                  <Text style={styles.statValue}>{item.reps}</Text>
                  <Text style={styles.statLabel}>reps</Text>
                </View>
              )}
            </View>

            {/* Muscle Groups */}
            {item.muscleGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Target Muscles</Text>
                <View style={styles.tagsContainer}>
                  {item.muscleGroups.map((muscle, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Equipment */}
            {item.equipment.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipment Needed</Text>
                <View style={styles.tagsContainer}>
                  {item.equipment.map((equip, index) => (
                    <View key={index} style={[styles.tag, styles.equipmentTag]}>
                      <Text style={[styles.tagText, styles.equipmentTagText]}>{equip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions */}
            {item.instructions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {item.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Benefits */}
            {item.benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Benefits</Text>
                {item.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={sportColor as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerIcon}>{sportIcon}</Text>
          <Text style={styles.headerTitle}>{sportName}</Text>
          <Text style={styles.headerSubtitle}>
            {data?.total || 0} exercises available
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={sportColor[0]} />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: sportColor[0] }]}
            onPress={() => {
              setLoading(true);
              loadExercises(selectedDifficulty);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderHeader()}
      
      <View style={styles.content}>
        {renderDifficultyFilter()}
        
        {data?.exercises && data.exercises.length > 0 ? (
          <FlatList
            data={data.exercises}
            renderItem={renderExerciseCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[sportColor[0]]}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No Exercises Found</Text>
            <Text style={styles.emptyText}>
              {selectedDifficulty !== 'all'
                ? `No ${selectedDifficulty} exercises available for ${sportName}`
                : `No exercises available for ${sportName} yet`}
            </Text>
            {selectedDifficulty !== 'all' && (
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: sportColor[0] }]}
                onPress={() => handleDifficultyChange('all')}
              >
                <Text style={styles.resetButtonText}>Show All Levels</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    height: 200,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: -100,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseIcon: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  exerciseImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  equipmentTag: {
    backgroundColor: '#fef3c7',
  },
  equipmentTagText: {
    color: '#92400e',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#4b5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
