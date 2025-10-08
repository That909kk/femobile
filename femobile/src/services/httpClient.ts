import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, STORAGE_KEYS } from '../constants';
import type { ApiResponse } from '../types/auth';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    console.log('🚀 HttpClient initializing with:', {
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      env_var: process.env.EXPO_PUBLIC_API_BASE_URL
    });
    
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
    // Request interceptor - Add token to headers
    this.instance.interceptors.request.use(
      async (config) => {
        console.log('🔗 HTTP Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          headers: config.headers
        });
        
        try {
          const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Token added to request');
          } else {
            console.log('⚠️ No auth token found');
          }
        } catch (error) {
          console.warn('Failed to get access token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            
            if (refreshToken) {
              // Try to refresh token
              const refreshResponse = await this.instance.post('/auth/refresh-token', {
                refreshToken,
              });

              if (refreshResponse.data.success && refreshResponse.data.data) {
                const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
                
                // Store new tokens
                await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.instance(originalRequest);
              }
            }
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
          }

          // If refresh fails, clear tokens and redirect to login
          await this.clearTokens();
          // Here you would typically navigate to login screen
          // This would be handled by auth store
        }

        return Promise.reject(error);
      }
    );
  }

  private async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log(`Making GET request to: ${this.instance.defaults.baseURL}${url}`);
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, config);
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        success: response.data?.success,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      return response.data;
    } catch (error: any) {
      console.log('❌ GET request error:', {
        message: error.message,
        url: url,
        baseURL: this.instance.defaults.baseURL,
        fullURL: `${this.instance.defaults.baseURL}${url}`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        hasResponse: !!error.response,
        code: error.code,
        name: error.name,
        config: {
          timeout: error.config?.timeout,
          headers: error.config?.headers
        }
      });
      
      if (error.response?.data) {
        return error.response.data;
      }
      // If no response data, create generic error response
      return {
        success: false,
        message: error.message || 'Đã xảy ra lỗi kết nối',
      } as ApiResponse<T>;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      // If no response data, create generic error response
      return {
        success: false,
        message: error.message || 'Đã xảy ra lỗi kết nối',
      } as ApiResponse<T>;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Đã xảy ra lỗi kết nối',
      } as ApiResponse<T>;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Đã xảy ra lỗi kết nối',
      } as ApiResponse<T>;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Đã xảy ra lỗi kết nối',
      } as ApiResponse<T>;
    }
  }
}

export const httpClient = new HttpClient();
