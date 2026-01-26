/**
 * History screen - shows all test results for an athlete with leaderboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TestResultCard, Loading, EmptyState } from '../components';
import { useAthlete, useTestResults } from '../hooks';
import { ApiService } from '../services';
import type { RootStackParamList, FitnessTestType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

type AgeGroup = 'U12' | 'U14' | 'U16' | 'U18' | 'U20' | 'adult' | null;

type LeaderboardEntry = {
  athleteId: string;
  athleteName: string;
  athleteAge: number;
  bestScore: number;
  testCount: number;
  rank: number;
};

export function HistoryScreen({ navigation, route }: Props) {
  const { athleteId } = route.params;
  const { athlete } = useAthlete(athleteId);
  const { results, loading, refresh } = useTestResults(athleteId);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  
  // Filters
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedTestType, setSelectedTestType] = useState<FitnessTestType | null>(null);

  const handleViewResult = (resultId: string) => {
    navigation.navigate('TestResult', { resultId });
  };

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      const data = await ApiService.getSegmentedLeaderboard({
        sport: selectedSport || undefined,
        ageGroup: selectedAgeGroup || undefined,
        school: selectedSchool || undefined,
        testType: selectedTestType || undefined,
        limit: 50,
      });
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [selectedSport, selectedAgeGroup, selectedSchool, selectedTestType]);

  useEffect(() => {
    if (showLeaderboard) {
      loadLeaderboard();
    }
  }, [showLeaderboard, selectedSport, selectedAgeGroup, selectedSchool, selectedTestType, loadLeaderboard]);

  if (loading) {
    return <Loading message="Loading history..." />;
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No Test History"
        message="Complete a fitness test to see your results here."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  // Calculate summary stats
  const totalTests = results.length;
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score.standardizedScore, 0) / totalTests
  );
  
  // Get best grade using explicit grade comparison
  const gradeOrder = ['A', 'B', 'C', 'D', 'F'] as const;
  type Grade = typeof gradeOrder[number];
  const bestGrade: Grade = results.reduce<Grade>(
    (best, r) => {
      const bestIndex = gradeOrder.indexOf(best);
      const currentIndex = gradeOrder.indexOf(r.score.grade);
      return currentIndex < bestIndex ? r.score.grade : best;
    },
    'F'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showLeaderboard && styles.tabActive]}
          onPress={() => setShowLeaderboard(false)}
        >
          <Text style={[styles.tabText, !showLeaderboard && styles.tabTextActive]}>
            My History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showLeaderboard && styles.tabActive]}
          onPress={() => setShowLeaderboard(true)}
        >
          <Text style={[styles.tabText, showLeaderboard && styles.tabTextActive]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {!showLeaderboard ? (
        <>
          {/* Summary Header */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {athlete ? `${athlete.firstName}'s History` : 'Test History'}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{totalTests}</Text>
                <Text style={styles.summaryLabel}>Tests</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{avgScore}</Text>
                <Text style={styles.summaryLabel}>Avg Score</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{bestGrade}</Text>
                <Text style={styles.summaryLabel}>Best Grade</Text>
              </View>
            </View>
          </View>

          {/* Results List */}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TestResultCard
                result={item}
                onPress={() => handleViewResult(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refresh}
            refreshing={loading}
          />
        </>
      ) : (
        <>
          {/* Leaderboard Filters */}
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filter Leaderboard</Text>
            
            {/* Age Group Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Age Group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedAgeGroup === null && styles.filterChipActive]}
                    onPress={() => setSelectedAgeGroup(null)}
                  >
                    <Text style={[styles.filterChipText, selectedAgeGroup === null && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {(['U12', 'U14', 'U16', 'U18', 'U20', 'adult'] as AgeGroup[]).map((age) => (
                    <TouchableOpacity
                      key={age}
                      style={[styles.filterChip, selectedAgeGroup === age && styles.filterChipActive]}
                      onPress={() => setSelectedAgeGroup(age)}
                    >
                      <Text style={[styles.filterChipText, selectedAgeGroup === age && styles.filterChipTextActive]}>
                        {age}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Test Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Test Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedTestType === null && styles.filterChipActive]}
                    onPress={() => setSelectedTestType(null)}
                  >
                    <Text style={[styles.filterChipText, selectedTestType === null && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {([
                    'squats',
                    'pushups',
                    'jump',
                    'situps',
                    'pullups',
                    'running',
                    'plank',
                    'wall_sit',
                    'burpees',
                    'lunges',
                    'mountain_climbers',
                    'broad_jump',
                    'single_leg_balance',
                    'lateral_hops',
                    'hand_release_pushups',
                    'shuttle_run',
                  ] as FitnessTestType[]).map((test) => (
                    <TouchableOpacity
                      key={test}
                      style={[styles.filterChip, selectedTestType === test && styles.filterChipActive]}
                      onPress={() => setSelectedTestType(test)}
                    >
                      <Text style={[styles.filterChipText, selectedTestType === test && styles.filterChipTextActive]}>
                        {test.charAt(0).toUpperCase() + test.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Leaderboard List */}
          {leaderboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardData.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No Leaderboard Data"
              message="No athletes match the selected filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setSelectedSport(null);
                setSelectedAgeGroup(null);
                setSelectedSchool(null);
                setSelectedTestType(null);
              }}
            />
          ) : (
            <FlatList
              data={leaderboardData}
              keyExtractor={(item) => item.athleteId}
              renderItem={({ item, index }) => (
                <View style={[
                  styles.leaderboardItem,
                  item.athleteId === athleteId && styles.leaderboardItemHighlight,
                ]}>
                  <View style={[
                    styles.rankBadge,
                    index === 0 && styles.rankBadgeGold,
                    index === 1 && styles.rankBadgeSilver,
                    index === 2 && styles.rankBadgeBronze,
                  ]}>
                    <Text style={styles.rankText}>#{item.rank}</Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>
                      {item.athleteName}
                      {item.athleteId === athleteId && ' (You)'}
                    </Text>
                    <Text style={styles.leaderboardDetails}>
                      Age {item.athleteAge} • {item.testCount} tests
                    </Text>
                  </View>
                  <View style={styles.leaderboardScore}>
                    <Text style={styles.leaderboardScoreValue}>{item.bestScore}</Text>
                    <Text style={styles.leaderboardScoreLabel}>score</Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.leaderboardList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  leaderboardList: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leaderboardItemHighlight: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeGold: {
    backgroundColor: '#fbbf24',
  },
  rankBadgeSilver: {
    backgroundColor: '#9ca3af',
  },
  rankBadgeBronze: {
    backgroundColor: '#d97706',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  leaderboardDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  leaderboardScore: {
    alignItems: 'flex-end',
  },
  leaderboardScoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  leaderboardScoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
