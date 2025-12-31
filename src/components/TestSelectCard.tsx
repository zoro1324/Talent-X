/**
 * Test selection card component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { getTestIcon } from '../utils';
import type { FitnessTestType } from '../types';

interface TestSelectCardProps {
  testType: FitnessTestType;
  name: string;
  description: string;
  duration: number;
  onPress: () => void;
}

export function TestSelectCard({
  testType,
  name,
  description,
  duration,
  onPress,
}: TestSelectCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.icon}>{getTestIcon(testType)}</Text>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.description}>{description}</Text>
            <Text style={styles.duration}>{duration} seconds</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  duration: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
    marginLeft: 12,
  },
});
