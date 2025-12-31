/**
 * Athlete card component for displaying athlete info in lists
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { getInitials, calculateAge, formatDate } from '../utils';
import type { AthleteProfile } from '../types';

interface AthleteCardProps {
  athlete: AthleteProfile;
  onPress: () => void;
  testCount?: number;
}

export function AthleteCard({ athlete, onPress, testCount = 0 }: AthleteCardProps) {
  const age = calculateAge(athlete.dateOfBirth);
  const initials = getInitials(athlete.firstName, athlete.lastName);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>
              {athlete.firstName} {athlete.lastName}
            </Text>
            <Text style={styles.details}>
              {age} years old • {athlete.gender}
            </Text>
            {athlete.sport && (
              <Text style={styles.sport}>{athlete.sport}</Text>
            )}
          </View>
          <View style={styles.stats}>
            <Text style={styles.testCount}>{testCount}</Text>
            <Text style={styles.testLabel}>tests</Text>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
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
  details: {
    fontSize: 14,
    color: '#6b7280',
  },
  sport: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 2,
  },
  stats: {
    alignItems: 'center',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  testCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  testLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
