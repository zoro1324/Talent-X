/**
 * Test athlete selection screen - choose athlete before selecting test
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AthleteCard, EmptyState, Loading } from '../components';
import { useAthletes, useTestResults } from '../hooks';
import type { RootStackParamList, AthleteProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList>;

export function TestAthleteSelectScreen({ navigation }: Props) {
  const { athletes, loading } = useAthletes();
  const { results } = useTestResults();
  const [searchQuery, setSearchQuery] = useState('');

  const testCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((result) => {
      counts[result.athleteId] = (counts[result.athleteId] || 0) + 1;
    });
    return counts;
  }, [results]);

  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;
    const query = searchQuery.toLowerCase();
    return athletes.filter(
      (athlete) =>
        athlete.firstName.toLowerCase().includes(query) ||
        athlete.lastName.toLowerCase().includes(query) ||
        athlete.sport?.toLowerCase().includes(query)
    );
  }, [athletes, searchQuery]);

  const handleSelectAthlete = (athlete: AthleteProfile) => {
    navigation.navigate('TestSelect', { athleteId: athlete.id });
  };

  const handleAddAthlete = () => {
    navigation.navigate('ProfileCreate');
  };

  if (loading) {
    return <Loading message="Loading athletes..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Athlete</Text>
        <Text style={styles.subtitle}>Choose who will take the test</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search athletes or sports..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {filteredAthletes.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            icon="👤"
            title={searchQuery ? 'No Matches Found' : 'No Athletes Yet'}
            message={
              searchQuery
                ? 'Try a different name or sport.'
                : 'Add an athlete to start a new test.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Add Athlete'}
            onAction={searchQuery ? () => setSearchQuery('') : handleAddAthlete}
          />
        </View>
      ) : (
        <FlatList
          data={filteredAthletes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AthleteCard
              athlete={item}
              onPress={() => handleSelectAthlete(item)}
              testCount={testCounts[item.id] || 0}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    marginTop: 12,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: '#111827',
  },
  clearBtn: {
    padding: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginLeft: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
});
