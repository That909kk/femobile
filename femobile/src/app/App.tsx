import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './AppNavigator';
import AppNavigator from './AppNavigator';
import { useAuth, useTokenValidation } from '../hooks';
import * as Font from 'expo-font';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

const AppContent: React.FC = () => {
  const { checkAuthStatus } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Set up automatic token validation
  useTokenValidation();

  useEffect(() => {
    const loadFonts = async () => {
      try {
        // Load default system fonts for Vietnamese support
        await Font.loadAsync({
          // System fonts typically support Vietnamese characters
          'System': Font.isLoaded('System') ? undefined : {},
        });
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Font loading error:', error);
        setFontsLoaded(true); // Continue anyway
      }
    };

    loadFonts();
    checkAuthStatus();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.text.secondary }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};
