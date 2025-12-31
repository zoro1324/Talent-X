/**
 * Test result screen - shows detailed results after completing a test
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Loading, EmptyState, ScoreDisplay } from '../components';
import { useAthlete, useTestResults } from '../hooks';
import { ScoringService } from '../services';
import {
  formatDateTime,
  getTestDisplayName,
  getTestIcon,
  formatDuration,
} from '../utils';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TestResult'>;

export function TestResultScreen({ navigation, route }: Props) {
  const { resultId } = route.params;
  const { results, loading } = useTestResults();
  
  const result = results.find((r) => r.id === resultId);
  const { athlete } = useAthlete(result?.athleteId);

  const handleDone = () => {
    navigation.popToTop();
  };

  const handleNewTest = () => {
    if (result) {
      navigation.replace('TestSelect', { athleteId: result.athleteId });
    }
  };

  if (loading) {
    return <Loading message="Loading result..." />;
  }

  if (!result) {
    return (
      <EmptyState
        icon="❓"
        title="Result Not Found"
        message="This test result could not be found."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const gradeDescription = ScoringService.getGradeDescription(result.score.grade);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{getTestIcon(result.testType)}</Text>
          <Text style={styles.headerTitle}>
            {getTestDisplayName(result.testType)}
          </Text>
          <Text style={styles.headerDate}>
            {formatDateTime(result.completedAt)}
          </Text>
          {athlete && (
            <Text style={styles.headerAthlete}>
              {athlete.firstName} {athlete.lastName}
            </Text>
          )}
        </View>

        {/* Score Display */}
        <Card style={styles.scoreCard}>
          <ScoreDisplay score={result.score} size="large" />
          <Text style={styles.gradeDescription}>{gradeDescription}</Text>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{result.totalReps}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{result.duration}s</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(result.averageFormScore)}%
            </Text>
            <Text style={styles.statLabel}>Avg Form</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {result.score.percentile || '-'}
            </Text>
            <Text style={styles.statLabel}>Percentile</Text>
          </Card>
        </View>

        {/* Feedback */}
        <Card style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>💡 Feedback</Text>
          {result.score.feedback.map((fb, index) => (
            <Text key={index} style={styles.feedbackItem}>
              • {fb}
            </Text>
          ))}
        </Card>

        {/* Rep Details */}
        {result.repetitions.length > 0 && (
          <Card style={styles.repCard}>
            <Text style={styles.repTitle}>Rep Details</Text>
            <View style={styles.repList}>
              {result.repetitions.slice(0, 10).map((rep, index) => (
                <View key={index} style={styles.repItem}>
                  <Text style={styles.repNumber}>Rep {index + 1}</Text>
                  <Text style={styles.repDuration}>
                    {(rep.duration / 1000).toFixed(1)}s
                  </Text>
                  <Text
                    style={[
                      styles.repForm,
                      { color: rep.formScore >= 80 ? '#22c55e' : '#f97316' },
                    ]}
                  >
                    {rep.formScore}%
                  </Text>
                </View>
              ))}
              {result.repetitions.length > 10 && (
                <Text style={styles.moreReps}>
                  +{result.repetitions.length - 10} more reps
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Try Again"
            onPress={handleNewTest}
            variant="outline"
            style={styles.actionButton}
            size="large"
          />
          <Button
            title="Done"
            onPress={handleDone}
            style={styles.actionButton}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  headerAthlete: {
    fontSize: 16,
    color: '#3b82f6',
    marginTop: 4,
    fontWeight: '500',
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  gradeDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  feedbackCard: {
    marginTop: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  feedbackItem: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 8,
  },
  repCard: {
    marginTop: 16,
  },
  repTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  repList: {
    gap: 8,
  },
  repItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  repNumber: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  repDuration: {
    fontSize: 14,
    color: '#1f2937',
    marginRight: 16,
  },
  repForm: {
    fontSize: 14,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  moreReps: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
  },
});
