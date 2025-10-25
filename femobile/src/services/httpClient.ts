import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, STORAGE_KEYS } from '../constants';
import type { ApiResponse } from '../types/auth';

declare const __DEV__: boolean;

type RawApiResponse<T> = ApiResponse<T> | (T & Record<string, unknown>);

class HttpClient {
  private instance: AxiosInstance;

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
          console.log('[httpClient] request', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL ?? API_CONFIG.BASE_URL}${config.url}`,
          });
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

            if (refreshToken) {
              const refreshResponse = await this.instance.post('/auth/refresh-token', {
                refreshToken,
              });

              if (refreshResponse.data?.success && refreshResponse.data.data) {
                const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

                await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.instance(originalRequest);
              }
            }
          } catch (refreshError) {
            if (__DEV__) {
              console.warn('[httpClient] token refresh failed', refreshError);
            }
          }

          await this.clearTokens();
        }

        return Promise.reject(error);
      },
    );
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
      return this.normalizeSuccess<T>(response.data);
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
        return this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
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
      return this.normalizeSuccess<T>(response.data);
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
        return this.normalizeError<T>(error.response.data, this.buildFallbackMessage(error));
      }

      return {
        success: false,
        message: this.buildFallbackMessage(error),
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
}

export const httpClient = new HttpClient();
