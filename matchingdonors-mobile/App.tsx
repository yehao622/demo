import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

// --- NEW NAVIGATION IMPORTS ---
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { styles } from './App.styles';

// Initialize the Bottom Tab Navigator
const Tab = createBottomTabNavigator();

// ==========================================
// NEW APP SCREENS (When Logged In)
// ==========================================

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Welcome to the Donor Network</Text>
    </View>
  );
}

function MatchesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matches</Text>
      <Text style={styles.subtitle}>Your potential transplant matches</Text>
    </View>
  );
}

// We pass the handleLogout function as a prop so the button works here!
function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>Manage your account securely</Text>

      <TouchableOpacity style={styles.loginButton} onPress={onLogout}>
        <Text style={styles.loginButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'patient' | 'donor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReady, setIsReady] = useState(false); // To prevent flickering while checking token

  // 1. Check token on startup
  useEffect(() => {
    const checkToken = async () => {
      const savedToken = await SecureStore.getItemAsync('user_token');
      if (savedToken) setIsLoggedIn(true);
      setIsReady(true); // Done checking!
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
        return;
      }

      await SecureStore.setItemAsync('user_token', data.token);
      await SecureStore.setItemAsync('user_role', role);
      setIsLoggedIn(true);

    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the backend server.');
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_role');
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  // Don't render anything until we know if the user has a token or not
  if (!isReady) return null;

  // ==========================================
  // NAVIGATION ROUTING LOGIC
  // ==========================================
  return (
    <NavigationContainer>
      {isLoggedIn ? (
        // IF LOGGED IN: Show the Bottom Tabs
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#1e293b' },
            headerTintColor: '#38bdf8',
            tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
            tabBarActiveTintColor: '#38bdf8',
            tabBarInactiveTintColor: '#64748b',

            // This function injects the correct icon based on the screen name!
            tabBarIcon: ({ focused, color, size }) => {
              // We use a strict TypeScript type here so VS Code knows exactly which icons exist
              let iconName: 'home' | 'home-outline' | 'heart' | 'heart-outline' | 'person' | 'person-outline' = 'home';

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Matches') {
                iconName = focused ? 'heart' : 'heart-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }

              // Return the actual icon component
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Matches" component={MatchesScreen} />
          {/* We use a specialized render to pass the logout prop to the Profile screen */}
          <Tab.Screen name="Profile">
            {() => <ProfileScreen onLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      ) : (
        // IF LOGGED OUT: Show the Login Screen
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>MatchingDonors</Text>
            <Text style={styles.subtitle}>Welcome back. Please log in.</Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'patient' && styles.activeRole]}
              onPress={() => setRole('patient')}
            >
              <Text style={[styles.roleText, role === 'patient' && styles.activeRoleText]}>Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'donor' && styles.activeRole]}
              onPress={() => setRole('donor')}
            >
              <Text style={[styles.roleText, role === 'donor' && styles.activeRoleText]}>Donor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <StatusBar style="light" />
        </KeyboardAvoidingView>
      )}
    </NavigationContainer>
  );
}