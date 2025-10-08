import { authService } from './authService';
import { useAuthStore } from '../store/authStore';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants';

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

      // Validate current token
      const isValid = await this.validateCurrentToken();
      
      if (isValid) {
        return true;
      }

      // Token is invalid, try to refresh
      return await this.handleTokenRefresh();
    } catch (error) {
      console.warn('Error ensuring valid token:', error);
      return false;
    }
  }

  /**
   * Validate the current access token
   */
  private async validateCurrentToken(): Promise<boolean> {
    try {
      const response = await authService.validateToken();
      return response.success && response.data?.valid === true;
    } catch (error) {
      console.warn('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Handle token refresh with concurrency protection
   */
  private async handleTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Start refreshing
    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        return false;
      }

      const response = await authService.refreshToken({ refreshToken });
      
      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        
        // Update auth store
        const authStore = useAuthStore.getState();
        authStore.setLoading(false);
        // You might want to update the store state here if needed
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Token refresh failed:', error);
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
      const authStore = useAuthStore.getState();
      await authStore.clearAuth();
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
      console.warn('Failed to clear tokens:', error);
    }
  }
}

export const tokenManager = new TokenManager();