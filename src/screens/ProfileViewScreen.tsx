/**
 * Profile view screen - shows athlete details and test history
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Loading,
  EmptyState,
  TestResultCard,
} from '../components';
import { useAthlete, useTestResults } from '../hooks';
import {
  calculateAge,
  formatDate,
  getInitials,
} from '../utils';
import { StorageService } from '../services';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileView'>;

export function ProfileViewScreen({ navigation, route }: Props) {
  const { athleteId } = route.params;
  const { athlete, loading: athleteLoading } = useAthlete(athleteId);
  const { results, loading: resultsLoading } = useTestResults(athleteId);

  const handleStartTest = () => {
    navigation.navigate('TestSelect', { athleteId });
  };

  const handleViewHistory = () => {
    navigation.navigate('History', { athleteId });
  };

  const handleViewResult = (resultId: string) => {
    navigation.navigate('TestResult', { resultId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete this athlete profile? All test results will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteAthlete(athleteId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  if (athleteLoading) {
    return <Loading message="Loading profile..." />;
  }

  if (!athlete) {
    return (
      <EmptyState
        icon="❓"
        title="Profile Not Found"
        message="This athlete profile could not be found."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const age = calculateAge(athlete.dateOfBirth);
  const initials = getInitials(athlete.firstName, athlete.lastName);
  const recentResults = results.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
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
          </View>

          <View style={styles.statsRow}>
            {athlete.height && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{athlete.height}</Text>
                <Text style={styles.statLabel}>cm</Text>
              </View>
            )}
            {athlete.weight && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{athlete.weight}</Text>
                <Text style={styles.statLabel}>kg</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Text style={styles.statValue}>{results.length}</Text>
              <Text style={styles.statLabel}>tests</Text>
            </View>
          </View>

          <Text style={styles.memberSince}>
            Member since {formatDate(athlete.createdAt)}
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Start New Test"
            onPress={handleStartTest}
            style={styles.primaryButton}
            size="large"
          />
        </View>

        {/* Recent Results */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Results</Text>
            {results.length > 3 && (
              <Button
                title="View All"
                onPress={handleViewHistory}
                variant="outline"
                size="small"
              />
            )}
          </View>

          {resultsLoading ? (
            <Loading message="Loading results..." size="small" />
          ) : recentResults.length === 0 ? (
            <Card>
              <Text style={styles.noResults}>
                No test results yet. Start a fitness test to see results here.
              </Text>
            </Card>
          ) : (
            recentResults.map((result) => (
              <TestResultCard
                key={result.id}
                result={result}
                onPress={() => handleViewResult(result.id)}
              />
            ))
          )}
        </View>

        {/* Delete Button */}
        <Button
          title="Delete Profile"
          onPress={handleDelete}
          variant="danger"
          style={styles.deleteButton}
        />
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
  profileCard: {
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  details: {
    fontSize: 15,
    color: '#6b7280',
  },
  sport: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  memberSince: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },
  actions: {
    marginTop: 16,
  },
  primaryButton: {
    width: '100%',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  noResults: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
  deleteButton: {
    marginTop: 32,
  },
});
