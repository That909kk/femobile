import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { tokenManager, setTokenManagerSessionExpiredCallback } from '../services/tokenManager';
import { setSessionExpiredCallback, resetSessionExpiredFlag } from '../services/httpClient';
import { STORAGE_KEYS, APP_CONFIG } from '../constants';
import type { 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyOTPRequest,
  UserRole,
  CustomerData,
  EmployeeData
} from '../types/auth';

// Login result với thông tin verification (tương tự web)
export interface LoginResult {
  success: boolean;
  requireEmailVerification?: boolean;
  email?: string;
  error?: string;
}

// Register result (tương tự web)
export interface RegisterResult {
  success: boolean;
  message?: string;
}

// Custom storage for Zustand persistence with SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('Failed to save to secure store:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn('Failed to remove from secure store:', error);
    }
  },
};

interface AuthActions {
  // Auth actions
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  register: (userData: RegisterRequest) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  
  // Password actions
  changePassword: (changeData: ChangePasswordRequest) => Promise<void>;
  forgotPassword: (forgotData: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (resetData: ResetPasswordRequest) => Promise<void>;
  
  // OTP actions
  verifyOTP: (otpData: VerifyOTPRequest) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  
  // Session actions
  refreshSession: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  refreshTokens: () => Promise<boolean>;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => {
      // Setup session expired callback for httpClient when store is created
      setSessionExpiredCallback(() => {
        get().clearAuth();
      });

      // Setup session expired callback for tokenManager to avoid circular dependency
      setTokenManagerSessionExpiredCallback(async () => {
        await get().clearAuth();
      });

      return {
        // Initial state
        isAuthenticated: false,
        user: null,
        role: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,

        // Login action
        // Note: Không set global loading lúc đầu để tránh trigger re-render AppNavigator
        // LoginScreen sẽ sử dụng local loading state
        login: async (credentials: LoginRequest): Promise<LoginResult> => {
        try {
          // Chỉ clear error, không set loading để tránh re-render AppNavigator
          set({ error: null });
          
          const response = await authService.login({
            ...credentials,
            deviceType: APP_CONFIG.DEVICE_TYPE,
          });

          if (response.success && response.data) {
            const { accessToken, refreshToken, role, data } = response.data;
            
            // Kiểm tra isEmailVerified cho CUSTOMER role (tương tự web)
            if (role === 'CUSTOMER') {
              const customerData = data as CustomerData;
              if (customerData.isEmailVerified === false) {
                // KHÔNG lưu token - chỉ trả về thông tin để navigate đến OTP
                
                return {
                  success: false,
                  requireEmailVerification: true,
                  email: customerData.email
                };
              }
            }
            
            // Email đã xác thực - Store tokens securely
            await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, role);
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
            
            // Reset session expired flag to allow new requests
            resetSessionExpiredFlag();
            
            set({
              isAuthenticated: true,
              user: data,
              role,
              accessToken,
              refreshToken,
              loading: false,
            });
            
            return { success: true };
          } else {
            throw new Error(response.message || 'Đăng nhập thất bại');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Đăng nhập thất bại',
            loading: false 
          });
          return { success: false, error: error.message || 'Đăng nhập thất bại' };
        }
      },

      // Register action
      // Note: Không set global loading để tránh trigger re-render AppNavigator
      // RegisterScreen sẽ sử dụng local loading state
      register: async (userData: RegisterRequest) => {
        try {
          // Chỉ clear error, không set loading để tránh re-render AppNavigator
          set({ error: null });
          
          const response = await authService.register(userData);
          
          // Check success
          if (response?.success) {
            return { success: true, message: response?.message || 'Đăng ký thành công' };
          } else {
            return { success: false, message: response?.message || 'Đăng ký thất bại' };
          }
        } catch (error: any) {
          set({ error: error.message || 'Đăng ký thất bại' });
          return { success: false, message: error.message || 'Đăng ký thất bại' };
        }
      },

      // Logout action
      logout: async () => {
        try {
          set({ loading: true });
          
          // Call logout API
          await authService.logout();
          
          // Clear all stored data
          await get().clearAuth();
        } catch (error) {
          console.warn('Logout API failed, clearing local data anyway:', error);
          await get().clearAuth();
        }
      },

      // Change password
      changePassword: async (changeData: ChangePasswordRequest) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.changePassword(changeData);
          
          if (response.success) {
            set({ loading: false });
          } else {
            throw new Error(response.message || 'Đổi mật khẩu thất bại');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Đổi mật khẩu thất bại',
            loading: false 
          });
          throw error;
        }
      },

      // Forgot password
      forgotPassword: async (forgotData: ForgotPasswordRequest) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.forgotPassword(forgotData);
          
          if (response.success) {
            set({ loading: false });
          } else {
            throw new Error(response.message || 'Gửi yêu cầu thất bại');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Gửi yêu cầu thất bại',
            loading: false 
          });
          throw error;
        }
      },

      // Reset password
      resetPassword: async (resetData: ResetPasswordRequest) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.resetPassword(resetData);
          
          if (response.success) {
            set({ loading: false });
          } else {
            throw new Error(response.message || 'Đặt lại mật khẩu thất bại');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Đặt lại mật khẩu thất bại',
            loading: false 
          });
          throw error;
        }
      },

      // Verify OTP
      verifyOTP: async (otpData: VerifyOTPRequest) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.verifyOTP(otpData);
          
          if (response.success) {
            set({ loading: false });
          } else {
            throw new Error(response.message || 'Xác thực OTP thất bại');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Xác thực OTP thất bại',
            loading: false 
          });
          throw error;
        }
      },

      // Resend OTP
      resendOTP: async (email: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.resendOTP(email);
          
          if (response.success) {
            set({ loading: false });
          } else {
            throw new Error(response.message || 'Gửi lại OTP thất bại');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Gửi lại OTP thất bại',
            loading: false 
          });
          throw error;
        }
      },

      // Refresh session
      refreshSession: async () => {
        try {
          const response = await authService.getCurrentSession();
          
          if (response.success && response.data) {
            set({ user: response.data });
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
          }
        } catch (error) {
          console.warn('Failed to refresh session:', error);
        }
      },

      // Check auth status
      checkAuthStatus: async () => {
        try {
          set({ loading: true });
          
          const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
          const userRole = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);
          
          // Chỉ cho phép vào nếu CÓ ĐỦ accessToken VÀ refreshToken
          if (!token || !refreshToken) {
            // Không có token -> đá ra ngoài login
            await get().clearAuth();
            set({ loading: false });
            return;
          }
          
          // Có token -> kiểm tra thêm userData và role
          if (userData && userRole) {
            set({
              isAuthenticated: true,
              accessToken: token,
              refreshToken,
              user: JSON.parse(userData),
              role: userRole as UserRole,
              loading: false,
            });
            
            // Validate current token and refresh if needed
            const isValidToken = await get().validateToken();
            if (!isValidToken) {
              const refreshSuccess = await get().refreshTokens();
              if (!refreshSuccess) {
                // Refresh thất bại -> đá ra ngoài login
                await get().clearAuth();
              }
            } else {
              // Refresh session data
              await get().refreshSession();
            }
          } else {
            // Có token nhưng thiếu userData hoặc role -> đá ra ngoài login
            await get().clearAuth();
            set({ loading: false });
          }
        } catch (error) {
          console.warn('Failed to check auth status:', error);
          // Có lỗi -> đá ra ngoài login để an toàn
          await get().clearAuth();
          set({ loading: false });
        }
      },

      // Validate current token - uses tokenManager to avoid httpClient interceptor conflicts
      validateToken: async (): Promise<boolean> => {
        try {
          // Use tokenManager's ensureValidToken which handles validation + refresh internally
          return await tokenManager.ensureValidToken();
        } catch (error) {
          console.warn('[AuthStore] Token validation failed:', error);
          return false;
        }
      },

      // Refresh tokens - uses tokenManager to avoid httpClient interceptor conflicts
      refreshTokens: async (): Promise<boolean> => {
        try {
          const currentRefreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (!currentRefreshToken) {
            return false;
          }

          // Use tokenManager's handleTokenRefresh which has proper locking
          const success = await tokenManager.handleTokenRefresh(currentRefreshToken);
          
          if (success) {
            // Get updated tokens from secure store
            const newAccessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            const newRefreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            
            // Update store state
            if (newAccessToken && newRefreshToken) {
              set({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              });
            }
            
            return true;
          }
          
          return false;
        } catch (error) {
          console.warn('[AuthStore] Failed to refresh tokens:', error);
          return false;
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Clear all auth data
      clearAuth: async () => {
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
        } catch (error) {
          console.warn('Failed to clear stored data:', error);
        }
        
        set({
          isAuthenticated: false,
          user: null,
          role: null,
          accessToken: null,
          refreshToken: null,
          loading: false,
          error: null,
        });
      },
    };
  },
    {
      name: 'auth-store',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
