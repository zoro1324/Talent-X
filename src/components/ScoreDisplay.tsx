/**
 * Score display component with animated gauge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getScoreColor, getGradeColor } from '../utils';
import type { TestScore } from '../types';

interface ScoreDisplayProps {
  score: TestScore;
  size?: 'small' | 'medium' | 'large';
}

export function ScoreDisplay({ score, size = 'medium' }: ScoreDisplayProps) {
  const gradeColor = getGradeColor(score.grade);
  const scoreColor = getScoreColor(score.standardizedScore);

  const dimensions = {
    small: { outer: 80, inner: 60, fontSize: 20, gradeSize: 14 },
    medium: { outer: 120, inner: 90, fontSize: 32, gradeSize: 18 },
    large: { outer: 160, inner: 120, fontSize: 48, gradeSize: 24 },
  }[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.outerRing,
          {
            width: dimensions.outer,
            height: dimensions.outer,
            borderRadius: dimensions.outer / 2,
            borderColor: scoreColor,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: dimensions.inner,
              height: dimensions.inner,
              borderRadius: dimensions.inner / 2,
            },
          ]}
        >
          <Text
            style={[styles.scoreText, { fontSize: dimensions.fontSize }]}
          >
            {score.standardizedScore}
          </Text>
        </View>
      </View>
      <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
        <Text style={[styles.gradeText, { fontSize: dimensions.gradeSize }]}>
          {score.grade}
        </Text>
      </View>
      {score.percentile && (
        <Text style={styles.percentile}>
          Top {100 - score.percentile}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  outerRing: {
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '700',
    color: '#1f2937',
  },
  gradeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  gradeText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  percentile: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});
