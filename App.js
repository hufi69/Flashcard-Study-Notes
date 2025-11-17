import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DeckListScreen from './screens/DeckListScreen';
import CreateDeckScreen from './screens/CreateDeckScreen';
import DeckDetailScreen from './screens/DeckDetailScreen';
import CreateCardScreen from './screens/CreateCardScreen';
import StudyScreen from './screens/StudyScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { getOnboardingStatus, isAuthenticated } from './utils/storage';

const Stack = createNativeStackNavigator();
const navigationRef = React.createRef();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  // Re-check auth when navigation state changes
  const handleNavigationStateChange = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated !== isAuth) {
        setIsAuth(authenticated);
        if (authenticated) {
          const hasCompletedOnboarding = await getOnboardingStatus();
          setShowOnboarding(!hasCompletedOnboarding);
        }
      }
    } catch (error) {
      console.error('Error in navigation state change:', error);
    }
  };

  const checkAuthAndOnboarding = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);
      
      if (authenticated) {
        const hasCompletedOnboarding = await getOnboardingStatus();
        setShowOnboarding(!hasCompletedOnboarding);
      }
    } catch (error) {
      console.error('Error checking auth and onboarding:', error);
      setIsAuth(false);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleNavigationStateChange}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
        initialRouteName={isAuth ? (showOnboarding ? 'Onboarding' : 'DeckList') : 'Login'}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="DeckList" component={DeckListScreen} />
        <Stack.Screen name="CreateDeck" component={CreateDeckScreen} />
        <Stack.Screen name="DeckDetail" component={DeckDetailScreen} />
        <Stack.Screen name="CreateCard" component={CreateCardScreen} />
        <Stack.Screen name="Study" component={StudyScreen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
  },
});
