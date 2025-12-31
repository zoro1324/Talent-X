/**
 * Home screen - displays list of athletes with sports categories
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AthleteCard, Button, Loading, EmptyState } from '../components';
import { useAthletes, useTestResults } from '../hooks';
import type { RootStackParamList, AthleteProfile } from '../types';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Sports categories with online images
const sportsCategories = [
  {
    id: '1',
    name: 'Cricket',
    icon: '🏏',
    color: ['#4CAF50', '#2E7D32'],
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
    athletes: 245,
  },
  {
    id: '2',
    name: 'Basketball',
    icon: '🏀',
    color: ['#FF9800', '#E65100'],
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
    athletes: 189,
  },
  {
    id: '3',
    name: 'Swimming',
    icon: '🏊',
    color: ['#2196F3', '#0D47A1'],
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400',
    athletes: 156,
  },
  {
    id: '4',
    name: 'Volleyball',
    icon: '🏐',
    color: ['#9C27B0', '#6A1B9A'],
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400',
    athletes: 134,
  },
  {
    id: '5',
    name: 'Kabaddi',
    icon: '🤼',
    color: ['#F44336', '#C62828'],
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400',
    athletes: 98,
  },
  {
    id: '6',
    name: 'Football',
    icon: '⚽',
    color: ['#00BCD4', '#00838F'],
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    athletes: 312,
  },
  {
    id: '7',
    name: 'Tennis',
    icon: '🎾',
    color: ['#CDDC39', '#9E9D24'],
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400',
    athletes: 87,
  },
  {
    id: '8',
    name: 'Athletics',
    icon: '🏃',
    color: ['#FF5722', '#BF360C'],
    image: 'https://images.unsplash.com/photo-1461896836934- voices-trail?w=400',
    athletes: 276,
  },
];

// Quick stats data
const quickStats = [
  { label: 'Total Athletes', value: '1,547', icon: '👥', trend: '+12%' },
  { label: 'Tests Today', value: '89', icon: '📊', trend: '+5%' },
  { label: 'Active Sports', value: '8', icon: '🏆', trend: '' },
  { label: 'Avg Score', value: '78.5', icon: '⭐', trend: '+3%' },
];

// Featured achievements
const achievements = [
  { id: '1', title: 'Top Performer', athlete: 'Rahul Kumar', sport: 'Cricket', score: 95 },
  { id: '2', title: 'Most Improved', athlete: 'Priya Singh', sport: 'Swimming', score: 88 },
  { id: '3', title: 'Rising Star', athlete: 'Amit Sharma', sport: 'Basketball', score: 82 },
];

export function HomeScreen({ navigation }: Props) {
  const { athletes, loading, refresh } = useAthletes();
  const { results } = useTestResults();
  const [testCounts, setTestCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteProfile[]>([]);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    // Calculate test counts per athlete
    const counts: Record<string, number> = {};
    results.forEach((result) => {
      counts[result.athleteId] = (counts[result.athleteId] || 0) + 1;
    });
    setTestCounts(counts);
  }, [results]);

  useEffect(() => {
    // Filter athletes based on search and sport selection
    let filtered = athletes;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (athlete) =>
          athlete.firstName.toLowerCase().includes(query) ||
          athlete.lastName.toLowerCase().includes(query) ||
          athlete.sport?.toLowerCase().includes(query)
      );
    }
    
    if (selectedSport) {
      filtered = filtered.filter(
        (athlete) => athlete.sport?.toLowerCase() === selectedSport.toLowerCase()
      );
    }
    
    setFilteredAthletes(filtered);
  }, [athletes, searchQuery, selectedSport]);

  const handleAthletePress = (athlete: AthleteProfile) => {
    navigation.navigate('ProfileView', { athleteId: athlete.id });
  };

  const handleAddAthlete = () => {
    navigation.navigate('ProfileCreate');
  };

  const handleSportPress = (sportName: string) => {
    if (selectedSport === sportName) {
      setSelectedSport(null);
    } else {
      setSelectedSport(sportName);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
  };

  const renderSportCard = ({ item }: { item: typeof sportsCategories[0] }) => (
    <TouchableOpacity
      style={[
        styles.sportCard,
        selectedSport === item.name && styles.sportCardSelected,
      ]}
      onPress={() => handleSportPress(item.name)}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.sportCardImage}
        imageStyle={styles.sportCardImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.sportCardGradient}
        >
          <Text style={styles.sportIcon}>{item.icon}</Text>
          <Text style={styles.sportName}>{item.name}</Text>
          <Text style={styles.sportAthletes}>{item.athletes} athletes</Text>
        </LinearGradient>
      </ImageBackground>
      {selectedSport === item.name && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIndicatorText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStatCard = (stat: typeof quickStats[0], index: number) => (
    <View key={index} style={styles.statCard}>
      <Text style={styles.statIcon}>{stat.icon}</Text>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
      {stat.trend && (
        <View style={styles.trendBadge}>
          <Text style={styles.trendText}>{stat.trend}</Text>
        </View>
      )}
    </View>
  );

  const renderAchievement = (item: typeof achievements[0]) => (
    <View key={item.id} style={styles.achievementCard}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.achievementGradient}
      >
        <View style={styles.achievementBadge}>
          <Text style={styles.achievementBadgeText}>🏆</Text>
        </View>
        <View style={styles.achievementContent}>
          <Text style={styles.achievementTitle}>{item.title}</Text>
          <Text style={styles.achievementAthlete}>{item.athlete}</Text>
          <Text style={styles.achievementSport}>{item.sport}</Text>
        </View>
        <View style={styles.achievementScore}>
          <Text style={styles.achievementScoreText}>{item.score}</Text>
          <Text style={styles.achievementScoreLabel}>Score</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return <Loading message="Loading athletes..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.title}>Talent-X</Text>
            <Text style={styles.subtitle}>Sports Assessment Platform</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Text style={styles.notificationIcon}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <Button
              title="+ Add"
              onPress={handleAddAthlete}
              size="small"
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search athletes, sports..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {(searchQuery || selectedSport) && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Quick Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            {quickStats.map(renderStatCard)}
          </ScrollView>
        </View>

        {/* Sports Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏅 Sports Categories</Text>
            {selectedSport && (
              <TouchableOpacity onPress={() => setSelectedSport(null)}>
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={sportsCategories}
            renderItem={renderSportCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportsContainer}
          />
        </View>

        {/* Featured Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Featured Achievements</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsContainer}
          >
            {achievements.map(renderAchievement)}
          </ScrollView>
        </View>

        {/* Athletes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              👥 Athletes {selectedSport ? `- ${selectedSport}` : ''}
            </Text>
            <Text style={styles.athleteCount}>
              {filteredAthletes.length} found
            </Text>
          </View>

          {filteredAthletes.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                icon="👤"
                title={searchQuery || selectedSport ? "No Matches Found" : "No Athletes Yet"}
                message={
                  searchQuery || selectedSport
                    ? "Try adjusting your search or filter criteria."
                    : "Add your first athlete profile to start conducting fitness assessments."
                }
                actionLabel={searchQuery || selectedSport ? "Clear Filters" : "Add Athlete"}
                onAction={searchQuery || selectedSport ? clearFilters : handleAddAthlete}
              />
            </View>
          ) : (
            <View style={styles.athletesList}>
              {filteredAthletes.map((athlete) => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  onPress={() => handleAthletePress(athlete)}
                  testCount={testCounts[athlete.id] || 0}
                />
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleAddAthlete}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>➕</Text>
                <Text style={styles.quickActionText}>Add Athlete</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={styles.quickActionText}>New Test</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📈</Text>
                <Text style={styles.quickActionText}>Reports</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📊</Text>
                <Text style={styles.quickActionText}>Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.tipCard}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.tipGradient}
            >
              <Text style={styles.tipIcon}>💡</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Pro Tip</Text>
                <Text style={styles.tipText}>
                  Use the sport filter to quickly find athletes by their primary sport category!
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearBtn: {
    padding: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 14,
  },
  filterIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 4,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  trendBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  trendText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  sportsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sportCard: {
    width: 140,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sportCardSelected: {
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  sportCardImage: {
    width: '100%',
    height: '100%',
  },
  sportCardImageStyle: {
    borderRadius: 20,
  },
  sportCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  sportIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sportAthletes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  achievementsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  achievementCard: {
    width: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  achievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  achievementBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeText: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  achievementAthlete: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  achievementSport: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  achievementScore: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  achievementScoreText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  achievementScoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  athleteCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
  },
  athletesList: {
    paddingHorizontal: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  tipIcon: {
    fontSize: 32,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  tipText: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 4,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 40,
  },
});
