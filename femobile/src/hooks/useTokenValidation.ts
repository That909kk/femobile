import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { tokenManager } from '../services/tokenManager';

// Token validation interval - 4 minutes (refresh trước khi access token hết hạn)
const TOKEN_VALIDATION_INTERVAL = 4 * 60 * 1000;

// Proactive refresh interval - refresh trước 2 phút khi token sắp hết hạn
const PROACTIVE_REFRESH_INTERVAL = 2 * 60 * 1000;

/**
 * Hook to automatically validate and refresh tokens
 * This should be used in the main App component or navigation root
 * 
 * Chiến lược duy trì session liên tục:
 * 1. Refresh token định kỳ mỗi 4 phút
 * 2. Refresh khi app từ background trở lại foreground
 * 3. Proactive refresh - refresh trước khi token hết hạn
 */
export const useTokenValidation = () => {
  const { isAuthenticated, validateToken, refreshTokens, clearAuth } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const validationInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const proactiveRefreshTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastRefreshTime = useRef<number>(Date.now());

  const validateAndRefreshIfNeeded = useCallback(async () => {
    try {
      const isValid = await validateToken();
      
      if (!isValid) {
        // Token is invalid, try to refresh
        const refreshSuccess = await refreshTokens();
        
        if (refreshSuccess) {
          lastRefreshTime.current = Date.now();
        } else {
          // Refresh failed, silently logout user
          await clearAuth();
        }
      } else {
        // Token valid, check if we should proactively refresh
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
        
        // Nếu đã 3 phút kể từ lần refresh cuối, refresh proactively
        if (timeSinceLastRefresh > 3 * 60 * 1000) {
          const refreshSuccess = await refreshTokens();
          if (refreshSuccess) {
            lastRefreshTime.current = Date.now();
          }
        }
      }
    } catch (error) {
      // Silently handle errors - don't show to user
    }
  }, [validateToken, refreshTokens, clearAuth]);

  // Validate token when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, immediately validate token
        if (isAuthenticated) {
          await validateAndRefreshIfNeeded();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, validateAndRefreshIfNeeded]);

  // Set up periodic token validation - more frequent for better session maintenance
  useEffect(() => {
    if (isAuthenticated) {
      // Validate token every 4 minutes when app is active
      validationInterval.current = setInterval(async () => {
        if (AppState.currentState === 'active') {
          await validateAndRefreshIfNeeded();
        }
      }, TOKEN_VALIDATION_INTERVAL);
      
      // Initial validation khi mới authenticated
      validateAndRefreshIfNeeded();
      lastRefreshTime.current = Date.now();
    } else {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
        validationInterval.current = undefined;
      }
      if (proactiveRefreshTimeout.current) {
        clearTimeout(proactiveRefreshTimeout.current);
        proactiveRefreshTimeout.current = undefined;
      }
    }

    return () => {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
      if (proactiveRefreshTimeout.current) {
        clearTimeout(proactiveRefreshTimeout.current);
      }
    };
  }, [isAuthenticated, validateAndRefreshIfNeeded]);

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