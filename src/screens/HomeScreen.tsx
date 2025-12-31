/**
 * Home screen - displays list of athletes
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AthleteCard, Button, Loading, EmptyState } from '../components';
import { useAthletes, useTestResults } from '../hooks';
import type { RootStackParamList, AthleteProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { athletes, loading, refresh } = useAthletes();
  const { results } = useTestResults();
  const [testCounts, setTestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Calculate test counts per athlete
    const counts: Record<string, number> = {};
    results.forEach((result) => {
      counts[result.athleteId] = (counts[result.athleteId] || 0) + 1;
    });
    setTestCounts(counts);
  }, [results]);

  const handleAthletePress = (athlete: AthleteProfile) => {
    navigation.navigate('ProfileView', { athleteId: athlete.id });
  };

  const handleAddAthlete = () => {
    navigation.navigate('ProfileCreate');
  };

  if (loading) {
    return <Loading message="Loading athletes..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Talent-X</Text>
          <Text style={styles.subtitle}>Sports Assessment</Text>
        </View>
        <Button
          title="+ Add"
          onPress={handleAddAthlete}
          size="small"
        />
      </View>

      {athletes.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No Athletes Yet"
          message="Add your first athlete profile to start conducting fitness assessments."
          actionLabel="Add Athlete"
          onAction={handleAddAthlete}
        />
      ) : (
        <FlatList
          data={athletes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AthleteCard
              athlete={item}
              onPress={() => handleAthletePress(item)}
              testCount={testCounts[item.id] || 0}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    padding: 16,
  },
});
