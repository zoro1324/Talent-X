/**
 * History screen - shows all test results for an athlete
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TestResultCard, Loading, EmptyState } from '../components';
import { useAthlete, useTestResults } from '../hooks';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({ navigation, route }: Props) {
  const { athleteId } = route.params;
  const { athlete } = useAthlete(athleteId);
  const { results, loading, refresh } = useTestResults(athleteId);

  const handleViewResult = (resultId: string) => {
    navigation.navigate('TestResult', { resultId });
  };

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
});
