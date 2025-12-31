/**
 * Athlete card component for displaying athlete info in lists
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';
import { getInitials, calculateAge, formatDate } from '../utils';
import type { AthleteProfile } from '../types';

interface AthleteCardProps {
  athlete: AthleteProfile;
  onPress: () => void;
  testCount?: number;
}

// Sport color mappings for avatars
const sportColors: Record<string, string[]> = {
  cricket: ['#4CAF50', '#2E7D32'],
  basketball: ['#FF9800', '#E65100'],
  swimming: ['#2196F3', '#0D47A1'],
  volleyball: ['#9C27B0', '#6A1B9A'],
  kabaddi: ['#F44336', '#C62828'],
  football: ['#00BCD4', '#00838F'],
  tennis: ['#8BC34A', '#558B2F'],
  athletics: ['#FF5722', '#BF360C'],
  default: ['#667eea', '#764ba2'],
};

const getSportEmoji = (sport?: string): string => {
  const sportEmojis: Record<string, string> = {
    cricket: '🏏',
    basketball: '🏀',
    swimming: '🏊',
    volleyball: '🏐',
    kabaddi: '🤼',
    football: '⚽',
    tennis: '🎾',
    athletics: '🏃',
  };
  return sportEmojis[sport?.toLowerCase() || ''] || '🏅';
};

export function AthleteCard({ athlete, onPress, testCount = 0 }: AthleteCardProps) {
  const age = calculateAge(athlete.dateOfBirth);
  const initials = getInitials(athlete.firstName, athlete.lastName);
  const colors = sportColors[athlete.sport?.toLowerCase() || 'default'] || sportColors.default;
  const sportEmoji = getSportEmoji(athlete.sport);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <LinearGradient
            colors={colors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.info}>
            <Text style={styles.name}>
              {athlete.firstName} {athlete.lastName}
            </Text>
            <Text style={styles.details}>
              {age} years old • {athlete.gender.charAt(0).toUpperCase() + athlete.gender.slice(1)}
            </Text>
            {athlete.sport && (
              <View style={styles.sportBadge}>
                <Text style={styles.sportEmoji}>{sportEmoji}</Text>
                <Text style={styles.sport}>{athlete.sport}</Text>
              </View>
            )}
          </View>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['#F0FDF4', '#DCFCE7']}
              style={styles.stats}
            >
              <Text style={styles.testCount}>{testCount}</Text>
              <Text style={styles.testLabel}>tests</Text>
            </LinearGradient>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 3,
  },
  details: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sportEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  sport: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  stats: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  testCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  testLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  arrowContainer: {
    marginTop: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
});
