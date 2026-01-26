/**
 * Test selection screen - choose which fitness test to perform
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
import { Card, TestSelectCard } from '../components';
import { ScoringService } from '../services';
import type { RootStackParamList, FitnessTestType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TestSelect'>;

const FITNESS_TESTS: FitnessTestType[] = [
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
];

export function TestSelectScreen({ navigation, route }: Props) {
  const { athleteId } = route.params;

  const handleSelectTest = (testType: FitnessTestType) => {
    navigation.navigate('TestCamera', { athleteId, testType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>📱 Offline AI Assessment</Text>
          <Text style={styles.infoText}>
            All pose analysis runs on your device - no internet required.
            Position yourself so the camera can see your full body.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Select a Test</Text>

        {FITNESS_TESTS.map((testType) => {
          const info = ScoringService.getTestInfo(testType);
          return (
            <TestSelectCard
              key={testType}
              testType={testType}
              name={info.name}
              description={info.description}
              duration={info.duration}
              onPress={() => handleSelectTest(testType)}
            />
          );
        })}

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Best Results</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Ensure good lighting</Text>
            <Text style={styles.tip}>• Wear fitted clothing</Text>
            <Text style={styles.tip}>• Clear space around you</Text>
            <Text style={styles.tip}>• Position phone at chest height</Text>
            <Text style={styles.tip}>• Stay 6-8 feet from camera</Text>
          </View>
        </Card>
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
  infoCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  tipsCard: {
    marginTop: 24,
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde047',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#854d0e',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tip: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
  },
});
