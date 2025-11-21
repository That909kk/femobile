import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './AppNavigator';
import AppNavigator from './AppNavigator';
import { useAuth, useTokenValidation } from '../hooks';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/websocketNotification';

const AppContent: React.FC = () => {
  const { checkAuthStatus, user, isAuthenticated } = useAuth();
  const addWebSocketNotification = useNotificationStore(state => state.addWebSocketNotification);
  const getUnreadCount = useNotificationStore(state => state.getUnreadCount);
  const userRole = useAuthStore(state => state.role) as UserRole | null;
  
  // Set up automatic token validation
  useTokenValidation();

  // Get user info for WebSocket connection
  const accountId = user?.accountId || null;

  // Callback to handle incoming WebSocket notifications
  const handleNotification = useCallback((notification: any) => {
    console.log('[App] Received WebSocket notification:', notification);
    
    // Add to notification store
    addWebSocketNotification(notification);
    
    // Refresh unread count
    getUnreadCount();
  }, [addWebSocketNotification, getUnreadCount]);

  // Setup WebSocket notifications - auto-connect when authenticated
  const { status, isConnected, error, retry } = useWebSocketNotifications({
    accountId,
    role: userRole,
    autoConnect: isAuthenticated && !!accountId && !!userRole,
    onNotification: handleNotification,
    onError: (err) => {
      console.error('[App] WebSocket notification error:', err);
    },
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Log WebSocket status changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[App] WebSocket Notification Status:', status);
      if (status === 'error' && error) {
        console.error('[App] WebSocket Connection Failed:', error);
        console.log('[App] To retry manually, call the retry() function');
      }
      if (status === 'connected') {
        console.log('[App] ✅ WebSocket notifications connected successfully!');
      }
    }
  }, [status, error, isAuthenticated]);

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
