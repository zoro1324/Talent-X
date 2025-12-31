/**
 * Profile creation screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TextInput, Button, Card } from '../components';
import { useAthletes } from '../hooks';
import { generateId, formatDate } from '../utils';
import type { RootStackParamList, AthleteProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileCreate'>;

type Gender = 'male' | 'female' | 'other';

// Available sports with icons and colors
const sportsOptions = [
  { name: 'Cricket', icon: '🏏', color: '#4CAF50' },
  { name: 'Basketball', icon: '🏀', color: '#FF9800' },
  { name: 'Swimming', icon: '🏊', color: '#2196F3' },
  { name: 'Volleyball', icon: '🏐', color: '#9C27B0' },
  { name: 'Kabaddi', icon: '🤼', color: '#F44336' },
  { name: 'Football', icon: '⚽', color: '#00BCD4' },
  { name: 'Tennis', icon: '🎾', color: '#8BC34A' },
  { name: 'Athletics', icon: '🏃', color: '#FF5722' },
  { name: 'Badminton', icon: '🏸', color: '#E91E63' },
  { name: 'Hockey', icon: '🏑', color: '#3F51B5' },
  { name: 'Table Tennis', icon: '🏓', color: '#009688' },
  { name: 'Boxing', icon: '🥊', color: '#795548' },
  { name: 'Wrestling', icon: '🤼‍♂️', color: '#607D8B' },
  { name: 'Gymnastics', icon: '🤸', color: '#FF4081' },
  { name: 'Cycling', icon: '🚴', color: '#FFC107' },
  { name: 'Other', icon: '🏅', color: '#9E9E9E' },
];

export function ProfileCreateScreen({ navigation }: Props) {
  const { saveAthlete } = useAthletes();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSportPicker, setShowSportPicker] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sport, setSport] = useState('');
  const [selectedSportIcon, setSelectedSportIcon] = useState('');

  const selectSport = (sportName: string, icon: string) => {
    setSport(sportName);
    setSelectedSportIcon(icon);
    setShowSportPicker(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (height && (isNaN(Number(height)) || Number(height) <= 0)) {
      newErrors.height = 'Enter a valid height';
    }
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) {
      newErrors.weight = 'Enter a valid weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
      setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
    }
  };

  // Format date in local time to avoid timezone shift (YYYY-MM-DD)
  const formatDateOfBirth = (): string => {
    if (!dateOfBirth) return '';
    const year = dateOfBirth.getFullYear();
    const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
    const day = String(dateOfBirth.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const athlete: AthleteProfile = {
        id: generateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: formatDateOfBirth(),
        gender,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        sport: sport.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await saveAthlete(athlete);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving athlete:', error);
      Alert.alert('Error', 'Failed to save athlete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const GenderOption = ({ value, label }: { value: Gender; label: string }) => (
    <TouchableOpacity
      style={[
        styles.genderOption,
        gender === value && styles.genderOptionSelected,
      ]}
      onPress={() => setGender(value)}
    >
      <Text
        style={[
          styles.genderText,
          gender === value && styles.genderTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <TextInput
            label="First Name *"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            placeholder="Enter first name"
            autoCapitalize="words"
          />

          <TextInput
            label="Last Name *"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            placeholder="Enter last name"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity
            style={[styles.dateInput, errors.dateOfBirth && styles.dateInputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
              {dateOfBirth ? formatDate(formatDateOfBirth()) : 'Select date of birth'}
            </Text>
          </TouchableOpacity>
          {errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
          )}
          
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
          )}

          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            <GenderOption value="male" label="Male" />
            <GenderOption value="female" label="Female" />
            <GenderOption value="other" label="Other" />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Physical Information (Optional)</Text>

          <TextInput
            label="Height (cm)"
            value={height}
            onChangeText={setHeight}
            error={errors.height}
            placeholder="e.g., 175"
            keyboardType="numeric"
          />

          <TextInput
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            error={errors.weight}
            placeholder="e.g., 70"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Sport</Text>
          <TouchableOpacity
            style={styles.sportInput}
            onPress={() => setShowSportPicker(true)}
          >
            {sport ? (
              <View style={styles.selectedSport}>
                <Text style={styles.sportIcon}>{selectedSportIcon}</Text>
                <Text style={styles.sportText}>{sport}</Text>
              </View>
            ) : (
              <Text style={styles.sportPlaceholder}>Select a sport</Text>
            )}
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </Card>

        <Button
          title="Create Profile"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
          size="large"
        />

        {/* Sport Picker Modal */}
        <Modal
          visible={showSportPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSportPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Select Sport</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowSportPicker(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>
              <FlatList
                data={sportsOptions}
                keyExtractor={(item) => item.name}
                numColumns={2}
                contentContainerStyle={styles.sportsGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.sportOption,
                      sport === item.name && styles.sportOptionSelected,
                      { borderColor: item.color }
                    ]}
                    onPress={() => selectSport(item.name, item.icon)}
                  >
                    <Text style={styles.sportOptionIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.sportOptionText,
                      sport === item.name && { color: item.color }
                    ]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
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
  card: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: -6,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  genderOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  genderTextSelected: {
    color: '#3b82f6',
  },
  button: {
    marginTop: 24,
  },
  dateInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dateInputError: {
    borderColor: '#ef4444',
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: -12,
    marginBottom: 16,
  },
  sportInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSport: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  sportText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  sportPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  sportsGrid: {
    padding: 16,
  },
  sportOption: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  sportOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  sportOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sportOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
