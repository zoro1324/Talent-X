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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TextInput, Button, Card } from '../components';
import { useAthletes } from '../hooks';
import { generateId, formatDate } from '../utils';
import type { RootStackParamList, AthleteProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileCreate'>;

type Gender = 'male' | 'female' | 'other';

export function ProfileCreateScreen({ navigation }: Props) {
  const { saveAthlete } = useAthletes();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sport, setSport] = useState('');

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

  const formatDateOfBirth = (): string => {
    if (!dateOfBirth) return '';
    return dateOfBirth.toISOString().split('T')[0];
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

          <TextInput
            label="Sport"
            value={sport}
            onChangeText={setSport}
            placeholder="e.g., Basketball, Soccer"
            autoCapitalize="words"
          />
        </Card>

        <Button
          title="Create Profile"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
          size="large"
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
});
