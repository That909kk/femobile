import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './AppNavigator';
import AppNavigator from './AppNavigator';
import { useAuth, useTokenValidation } from '../hooks';

const AppContent: React.FC = () => {
  const { checkAuthStatus } = useAuth();
  
  // Set up automatic token validation
  useTokenValidation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

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
