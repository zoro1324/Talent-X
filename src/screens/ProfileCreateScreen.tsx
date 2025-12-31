/**
 * Profile creation screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TextInput, Button, Card } from '../components';
import { useAthletes } from '../hooks';
import { generateId, isValidDate } from '../utils';
import type { RootStackParamList, AthleteProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileCreate'>;

type Gender = 'male' | 'female' | 'other';

export function ProfileCreateScreen({ navigation }: Props) {
  const { saveAthlete } = useAthletes();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
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
    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!isValidDate(dateOfBirth)) {
      newErrors.dateOfBirth = 'Enter date as YYYY-MM-DD';
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

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const athlete: AthleteProfile = {
        id: generateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
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
      Alert.alert('Error', 'Failed to save athlete profile');
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

          <TextInput
            label="Date of Birth *"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            error={errors.dateOfBirth}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />

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
    gap: 12,
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
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
});
