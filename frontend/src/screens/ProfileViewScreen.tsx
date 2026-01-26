/**
 * Profile view screen - shows athlete details and test history
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Loading,
  EmptyState,
  TestResultCard,
  PlanWidget,
} from '../components';
import { useAthlete, useTestResults } from '../hooks';
import {
  calculateAge,
  formatDate,
  getInitials,
} from '../utils';
import { StorageService, ApiService } from '../services';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileView'>;

type PlanDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export function ProfileViewScreen({ navigation, route }: Props) {
  const { athleteId } = route.params;
  const { athlete, loading: athleteLoading } = useAthlete(athleteId);
  const { results, loading: resultsLoading } = useTestResults(athleteId);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PlanDifficulty>('intermediate');
  const [selectedDays, setSelectedDays] = useState<boolean[]>([true, true, true, true, true, false, false]); // Mon-Fri selected
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStartTest = () => {
    navigation.navigate('TestSelect', { athleteId });
  };

  const handleViewHistory = () => {
    navigation.navigate('History', { athleteId });
  };

  const handleViewResult = (resultId: string) => {
    navigation.navigate('TestResult', { resultId });
  };

  const handleGeneratePlan = async () => {
    if (!athlete) return;

    const daysPerWeek = selectedDays.filter(Boolean).length;
    if (daysPerWeek === 0) {
      Alert.alert('Invalid Selection', 'Please select at least one training day per week.');
      return;
    }

    try {
      setPlanGenerating(true);
      
      // Calculate weekly volume based on days selected (60-180 min)
      const weeklyVolume = daysPerWeek * 30; // 30 min per day average
      
      await ApiService.generatePlan({
        athleteId,
        sport: athlete.sport || 'General Fitness',
        difficulty: selectedDifficulty,
        weeklyVolume,
        userAvailability: selectedDays.map((selected, index) => 
          selected ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index] : null
        ).filter(Boolean) as string[],
      });

      setShowPlanModal(false);
      setRefreshKey(prev => prev + 1);
      Alert.alert('Success', 'Training plan generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate training plan. Please try again.');
    } finally {
      setPlanGenerating(false);
    }
  };

  const toggleDay = (index: number) => {
    const newDays = [...selectedDays];
    newDays[index] = !newDays[index];
    setSelectedDays(newDays);
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

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const difficulties: PlanDifficulty[] = ['beginner', 'intermediate', 'advanced', 'elite'];

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
          <Button
            title="Generate Training Plan"
            onPress={() => setShowPlanModal(true)}
            variant="outline"
            style={styles.secondaryButton}
            size="large"
          />
        </View>

        {/* Training Plan Widget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Plan</Text>
          <PlanWidget 
            key={refreshKey}
            athleteId={athleteId}
            onPlanPress={() => {/* Navigate to plan details */}}
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

      {/* Plan Generation Modal */}
      <Modal
        visible={showPlanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate Training Plan</Text>
            
            {/* Difficulty Selection */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Difficulty Level</Text>
              <View style={styles.difficultyRow}>
                {difficulties.map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.difficultyChip,
                      selectedDifficulty === difficulty && styles.difficultyChipSelected,
                    ]}
                    onPress={() => setSelectedDifficulty(difficulty)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        selectedDifficulty === difficulty && styles.difficultyTextSelected,
                      ]}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Days Selection */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                Training Days ({selectedDays.filter(Boolean).length} days/week)
              </Text>
              <View style={styles.daysRow}>
                {dayNames.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayChip,
                      selectedDays[index] && styles.dayChipSelected,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selectedDays[index] && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sport Info */}
            {athlete && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Sport</Text>
                <Text style={styles.sportText}>{athlete.sport || 'General Fitness'}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowPlanModal(false)}
                variant="outline"
                style={styles.modalButton}
                disabled={planGenerating}
              />
              <Button
                title={planGenerating ? "Generating..." : "Generate"}
                onPress={handleGeneratePlan}
                style={styles.modalButton}
                disabled={planGenerating}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  difficultyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  difficultyChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  difficultyTextSelected: {
    color: '#ffffff',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  sportText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
