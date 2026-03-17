import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import our newly modularized screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // 1. App Startup: Check if user already has a token
  useEffect(() => {
    const checkToken = async () => {
      const savedToken = await SecureStore.getItemAsync('user_token');
      if (savedToken) setIsLoggedIn(true);
      setIsReady(true);
    };
    checkToken();
  }, []);

  // 2. Global Logout Handler
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_role');
    setIsLoggedIn(false);
  };

  // 3. Wait until we check the secure storage before rendering to avoid screen flicker
  if (!isReady) return null;

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#1e293b' },
            headerTintColor: '#38bdf8',
            tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
            tabBarActiveTintColor: '#38bdf8',
            tabBarInactiveTintColor: '#64748b',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any = 'home';
              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Matches') iconName = focused ? 'heart' : 'heart-outline';
              else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Matches" component={MatchesScreen} />
          <Tab.Screen name="Profile">
            {() => <ProfileScreen onLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      ) : (
        <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
}