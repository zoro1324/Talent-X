/**
 * Talent-X: Offline-First Sports Talent Assessment App
 * 
 * Main application entry point with navigation setup.
 * All pose analysis and scoring runs locally (Edge AI) without internet dependency.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LoginScreen,
  SignupScreen,
  HomeScreen,
  ProfileCreateScreen,
  ProfileViewScreen,
  TestAthleteSelectScreen,
  TestSelectScreen,
  TestCameraScreen,
  TestResultScreen,
  HistoryScreen,
  SportExercisesScreen,
} from './src/screens';
import type { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1f2937',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#f9fafb',
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileCreate"
          component={ProfileCreateScreen}
          options={{ title: 'New Athlete' }}
        />
        <Stack.Screen
          name="ProfileView"
          component={ProfileViewScreen}
          options={{ title: 'Athlete Profile' }}
        />
        <Stack.Screen
          name="TestAthleteSelect"
          component={TestAthleteSelectScreen}
          options={{ title: 'Select Athlete' }}
        />
        <Stack.Screen
          name="TestSelect"
          component={TestSelectScreen}
          options={{ title: 'Select Test' }}
        />
        <Stack.Screen
          name="TestCamera"
          component={TestCameraScreen}
          options={{
            title: 'Fitness Test',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TestResult"
          component={TestResultScreen}
          options={{
            title: 'Results',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Test History' }}
        />
        <Stack.Screen
          name="SportExercises"
          component={SportExercisesScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
