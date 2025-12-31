/**
 * Test result card component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import {
  formatDateTime,
  getTestDisplayName,
  getTestIcon,
  getGradeColor,
} from '../utils';
import type { TestResult } from '../types';

interface TestResultCardProps {
  result: TestResult;
  onPress: () => void;
}

export function TestResultCard({ result, onPress }: TestResultCardProps) {
  const gradeColor = getGradeColor(result.score.grade);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getTestIcon(result.testType)}</Text>
          <View style={styles.testInfo}>
            <Text style={styles.testName}>
              {getTestDisplayName(result.testType)}
            </Text>
            <Text style={styles.date}>
              {formatDateTime(result.completedAt)}
            </Text>
          </View>
          <View style={[styles.grade, { backgroundColor: gradeColor }]}>
            <Text style={styles.gradeText}>{result.score.grade}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{result.totalReps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{result.score.standardizedScore}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(result.averageFormScore)}%</Text>
            <Text style={styles.statLabel}>Form</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{result.duration}s</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  grade: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
