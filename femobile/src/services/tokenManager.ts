import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { STORAGE_KEYS, API_CONFIG } from '../constants';

// Callback for when session expires - will be set externally to avoid circular dependency
let onSessionExpiredCallback: (() => Promise<void>) | null = null;

export const setTokenManagerSessionExpiredCallback = (callback: () => Promise<void>) => {
  onSessionExpiredCallback = callback;
};

class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Check if the current token is valid
   * If invalid, attempt to refresh automatically
   * Returns true if user has valid session, false if needs to login
   */
  async ensureValidToken(): Promise<boolean> {
    try {
      // First check if we have tokens
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!accessToken || !refreshToken) {
        return false;
      }

      // Validate current token using direct axios call to avoid httpClient interceptors
      const isValid = await this.validateCurrentToken(accessToken);
      
      if (isValid) {
        return true;
      }

      // Token is invalid, try to refresh
      return await this.handleTokenRefresh(refreshToken);
    } catch (error) {
      console.warn('[TokenManager] Error ensuring valid token:', error);
      return false;
    }
  }

  /**
   * Validate the current access token - uses direct axios to avoid interceptor loops
   */
  private async validateCurrentToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/auth/validate-token`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.TIMEOUT,
        }
      );
      return response.data?.success && response.data?.data?.valid === true;
    } catch (error: any) {
      // 401 means token is invalid, other errors we should log
      if (error?.response?.status !== 401) {
        console.warn('[TokenManager] Token validation error:', error?.message);
      }
      return false;
    }
  }

  /**
   * Handle token refresh with concurrency protection
   */
  async handleTokenRefresh(refreshToken?: string): Promise<boolean> {
    // If already refreshing, wait for the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Start refreshing
    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh - uses direct axios to avoid interceptor loops
   */
  private async performTokenRefresh(providedRefreshToken?: string): Promise<boolean> {
    try {
      const refreshToken = providedRefreshToken || await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const currentAccessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!refreshToken) {
        return false;
      }

      // Use direct axios call to avoid httpClient interceptors
      // Include Authorization header as backend may require it
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            // Include current access token if available (some backends require this)
            ...(currentAccessToken ? { 'Authorization': `Bearer ${currentAccessToken}` } : {}),
          },
          timeout: API_CONFIG.TIMEOUT,
        }
      );
      
      if (response.data?.success && response.data?.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;


        // Store new tokens
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        
        return true;
      }
      
      // Silently handle invalid response - just return false
      return false;
    } catch (error: any) {
      const errorStatus = error?.response?.status;
      
      // Nếu refresh token không hợp lệ (401) hoặc bị revoke, âm thầm logout
      if (errorStatus === 401 || errorStatus === 403) {
        // Silently clear tokens and logout - no error messages to user
        await this.clearTokens();
        
        // Trigger session expired callback để logout (silent)
        if (onSessionExpiredCallback) {
          await onSessionExpiredCallback();
        }
      }
      
      return false;
    }
  }

  /**
   * Schedule automatic token validation and refresh
   * This can be called periodically to maintain active sessions
   */
  async scheduleTokenValidation(): Promise<void> {
    const isValid = await this.ensureValidToken();
    
    if (!isValid) {
      // Token refresh failed, user needs to login again
      // Use callback to avoid circular dependency with authStore
      if (onSessionExpiredCallback) {
        await onSessionExpiredCallback();
      } else {
        // Fallback: clear tokens locally
        await this.clearTokens();
      }
    }
  }

  /**
   * Check if tokens exist in storage
   */
  async hasStoredTokens(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      return !!(accessToken && refreshToken);
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all tokens from storage
   */
  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.warn('[TokenManager] Failed to clear tokens:', error);
    }
  }
}

export const tokenManager = new TokenManager();