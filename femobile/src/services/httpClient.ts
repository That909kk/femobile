import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, STORAGE_KEYS } from '../constants';
import type { ApiResponse } from '../types/auth';

declare const __DEV__: boolean;

type RawApiResponse<T> = ApiResponse<T> | (T & Record<string, unknown>);

// Session expired callback - will be set by authStore
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
  onSessionExpired = callback;
};

// Types for request queue
interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: InternalAxiosRequestConfig;
}

class HttpClient {
  private instance: AxiosInstance;
  
  // Token refresh state management - prevents race conditions
  private isRefreshingToken = false;
  private refreshTokenPromise: Promise<boolean> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private sessionExpiredTriggered = false;

  constructor() {
    if (__DEV__) {
      console.log('[httpClient] init', {
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        envVar: process.env.EXPO_PUBLIC_API_BASE_URL,
      });
    }

    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Reset session expired flag - call this after successful login
   */
  public resetSessionExpiredFlag() {
    this.sessionExpiredTriggered = false;
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('[httpClient] token lookup failed', error);
          }
        }

        if (__DEV__) {
          // Build full URL with query params for logging
          let fullUrl = `${config.baseURL ?? API_CONFIG.BASE_URL}${config.url}`;
          if (config.params) {
            const searchParams = new URLSearchParams();
            Object.keys(config.params).forEach(key => {
              searchParams.append(key, config.params[key]);
            });
            fullUrl += `?${searchParams.toString()}`;
          }
          
          console.log('[httpClient] request', {
            method: config.method?.toUpperCase(),
            url: fullUrl,
            params: config.params,
          });
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _queued?: boolean };

        // Skip if not 401 or already retried or no config
        if (error.response?.status !== 401 || originalRequest?._retry || !originalRequest) {
          return Promise.reject(error);
        }

        // Skip refresh for auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');
        if (isAuthEndpoint) {
          return Promise.reject(error);
        }

        // Mark as retrying
        originalRequest._retry = true;

        // If already refreshing, queue this request
        if (this.isRefreshingToken) {
          return new Promise((resolve, reject) => {
            this.requestQueue.push({ resolve, reject, config: originalRequest });
          });
        }

        // Start token refresh
        try {
          const refreshSuccess = await this.refreshTokenWithLock();
          
          if (refreshSuccess) {
            // Get new token and retry original request
            const newToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            if (newToken) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.instance(originalRequest);
            }
          }
          
          // Refresh failed, trigger session expired
          await this.handleSessionExpired();
          return Promise.reject(error);
        } catch (refreshError) {
          await this.handleSessionExpired();
          return Promise.reject(refreshError);
        }
      },
    );
  }

  /**
   * Refresh token with lock to prevent concurrent refresh attempts
   */
  private async refreshTokenWithLock(): Promise<boolean> {
    // If already refreshing, return existing promise
    if (this.isRefreshingToken && this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    // Start refresh with lock
    this.isRefreshingToken = true;
    this.refreshTokenPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshTokenPromise;
      
      // Process queued requests
      if (result) {
        await this.processRequestQueue(true);
      } else {
        await this.processRequestQueue(false);
      }
      
      return result;
    } finally {
      this.isRefreshingToken = false;
      this.refreshTokenPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const currentAccessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

      if (!refreshToken) {
        return false;
      }

      // Make refresh request without interceptors to avoid loops
      // Include Authorization header as backend may require it
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/refresh-token`,
        { refreshToken },
        {
          timeout: API_CONFIG.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            // Include current access token if available (some backends require this)
            ...(currentAccessToken ? { 'Authorization': `Bearer ${currentAccessToken}` } : {}),
          },
        }
      );

      if (response.data?.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // Reset session expired flag on successful refresh
        this.sessionExpiredTriggered = false;
        
        return true;
      } else {
        // Silently handle invalid response
        return false;
      }
    } catch (error: any) {
      // Silently handle token refresh failure - no error messages to user
      // Just return false and let the caller handle it
      return false;
    }
  }

  /**
   * Process queued requests after token refresh
   */
  private async processRequestQueue(success: boolean): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const { resolve, reject, config } of queue) {
      if (success) {
        try {
          // Get new token and update request
          const newToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          if (newToken) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          // Retry the request
          const response = await this.instance(config);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Token refresh failed'));
      }
    }
  }

  /**
   * Handle session expired - only trigger once
   */
  private async handleSessionExpired(): Promise<void> {
    if (this.sessionExpiredTriggered) {
      return;
    }

    this.sessionExpiredTriggered = true;

    await this.clearTokens();

    // Clear request queue
    this.requestQueue.forEach(({ reject }) => {
      reject(new Error('Session expired'));
    });
    this.requestQueue = [];

    if (onSessionExpired) {
      onSessionExpired();
    }
  }

  private async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
    } catch (error) {
      if (__DEV__) {
        console.warn('[httpClient] clearTokens failed', error);
      }
    }
  }

  private normalizeSuccess<T>(payload: RawApiResponse<T>): ApiResponse<T> {
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload as ApiResponse<T>;
    }

    return {
      success: true,
      message: '',
      data: payload as T,
    };
  }

  private normalizeError<T>(payload: any, fallbackMessage: string): ApiResponse<T> {
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload as ApiResponse<T>;
    }

    const message =
      typeof payload?.message === 'string' && payload.message.trim().length > 0
        ? payload.message
        : fallbackMessage;

    return {
      success: false,
      message,
      data: payload?.data as T | undefined,
      errors: Array.isArray(payload?.errors) ? payload.errors : undefined,
    };
  }

  private buildFallbackMessage(error: any): string {
    return error?.message || 'Da xay ra loi ket noi';
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<RawApiResponse<T>> = await this.instance.get(url, config);
      const normalized = this.normalizeSuccess<T>(response.data);
      normalized.status = response.status;
      return normalized;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[httpClient] GET error', {
          url,
          status: error.response?.status || 'No status',
          data: error.response?.data || 'No data',
          message: error.message || 'No message'
        });
      }

      if (error.response?.data) {
        const normalized = this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
        normalized.status = error.response.status;
        return normalized;
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
        status: error.response?.status,
      };
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<RawApiResponse<T>> = await this.instance.post(
        url,
        data,
        config,
      );
      const normalized = this.normalizeSuccess<T>(response.data);
      normalized.status = response.status;
      return normalized;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[httpClient] POST error', {
          url,
          status: error.response?.status || 'No status',
          data: error.response?.data || 'No data',
          message: error.message || 'No message'
        });
      }

      if (error.response?.data) {
        const normalized = this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
        normalized.status = error.response.status;
        return normalized;
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
        status: error.response?.status,
      };
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<RawApiResponse<T>> = await this.instance.put(
        url,
        data,
        config,
      );
      return this.normalizeSuccess<T>(response.data);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[httpClient] PUT error', {
          url,
          status: error.response?.status || 'No status',
          data: error.response?.data || 'No data',
          message: error.message || 'No message'
        });
      }

      if (error.response?.data) {
        return this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
      };
    }
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<RawApiResponse<T>> = await this.instance.patch(
        url,
        data,
        config,
      );
      return this.normalizeSuccess<T>(response.data);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[httpClient] PATCH error', {
          url,
          status: error.response?.status || 'No status',
          data: error.response?.data || 'No data',
          message: error.message || 'No message'
        });
      }

      if (error.response?.data) {
        return this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
      };
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<RawApiResponse<T>> = await this.instance.delete(url, config);
      return this.normalizeSuccess<T>(response.data);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[httpClient] DELETE error', {
          url,
          status: error.response?.status || 'No status',
          data: error.response?.data || 'No data',
          message: error.message || 'No message'
        });
      }

      if (error.response?.data) {
        return this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
      };
    }
  }

  async postFormData<T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<RawApiResponse<T>> = await this.instance.post(
        url,
        formData,
        {
          ...config,
          headers: {
            ...config?.headers,
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return this.normalizeSuccess<T>(response.data);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[httpClient] POST FormData error', {
          url,
          status: error.response?.status || 'No status',
          data: error.response?.data || 'No data',
          message: error.message || 'No message'
        });
      }

      if (error.response?.data) {
        return this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
      };
    }
  }
}

export const httpClient = new HttpClient();

// Export helper to reset session expired flag after successful login
export const resetSessionExpiredFlag = () => {
  httpClient.resetSessionExpiredFlag();
};
