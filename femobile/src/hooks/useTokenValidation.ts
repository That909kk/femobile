import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { tokenManager } from '../services/tokenManager';

/**
 * Hook to automatically validate and refresh tokens
 * This should be used in the main App component or navigation root
 */
export const useTokenValidation = () => {
  const { isAuthenticated, validateToken, refreshTokens, clearAuth } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const validationInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Validate token when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, validate token
        if (isAuthenticated) {
          await validateAndRefreshIfNeeded();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated]);

  // Set up periodic token validation
  useEffect(() => {
    if (isAuthenticated) {
      // Validate token every 5 minutes when app is active
      validationInterval.current = setInterval(async () => {
        if (AppState.currentState === 'active') {
          await validateAndRefreshIfNeeded();
        }
      }, 5 * 60 * 1000); // 5 minutes
    } else {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
        validationInterval.current = undefined;
      }
    }

    return () => {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
    };
  }, [isAuthenticated]);

  const validateAndRefreshIfNeeded = async () => {
    try {
      const isValid = await validateToken();
      
      if (!isValid) {
        // Token is invalid, try to refresh
        const refreshSuccess = await refreshTokens();
        
        if (!refreshSuccess) {
          // Refresh failed, logout user
          await clearAuth();
        }
      }
    } catch (error) {
      console.warn('Token validation error:', error);
    }
  };

  return {
    validateAndRefreshIfNeeded,
  };
};

/**
 * Hook to ensure valid token before making API calls
 * Use this in screens that make authenticated API requests
 */
export const useEnsureValidToken = () => {
  const { isAuthenticated } = useAuthStore();

  const ensureValidToken = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    return await tokenManager.ensureValidToken();
  };

  return {
    ensureValidToken,
  };
};