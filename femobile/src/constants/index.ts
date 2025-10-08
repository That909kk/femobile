import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: 10000,
};

// Export animation configurations
export * from './animations';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  USER_ROLE: 'userRole',
  LANGUAGE: 'language',
  REMEMBER_ME: 'rememberMe',
};

// Colors - Professional Housekeeping Service Design
export const COLORS = {
  primary: '#2E7D32', // Green 700 - Professional, trustworthy
  primaryDark: '#1B5E20', // Green 800
  primaryLight: '#66BB6A', // Green 400
  secondary: '#1976D2', // Blue 700 - Professional, reliable
  secondaryDark: '#1565C0', // Blue 800
  secondaryLight: '#64B5F6', // Blue 300
  accent: '#FF9800', // Orange 500 - Warm, friendly
  success: '#4CAF50', // Green 500
  warning: '#FF9800', // Orange 500
  error: '#F44336', // Red 500
  background: '#FAFAFA', // Very light gray
  backgroundDark: '#F5F5F5', // Light gray
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  text: {
    primary: '#212121', // Dark gray
    secondary: '#616161', // Medium gray
    tertiary: '#9E9E9E', // Light gray
    disabled: '#BDBDBD', // Very light gray
    inverse: '#FFFFFF',
  },
  border: '#E0E0E0', // Light gray
  borderLight: '#F5F5F5',
  borderDark: '#BDBDBD',
  shadow: 'rgba(0, 0, 0, 0.12)',
  gradient: {
    primary: ['#2E7D32', '#4CAF50'], // Green gradient
    secondary: ['#1976D2', '#2196F3'], // Blue gradient
    accent: ['#FF9800', '#FFB74D'], // Orange gradient
    service: ['#E8F5E8', '#C8E6C9'], // Light green gradient for service cards
  },
};

// Screen Routes
export const ROUTES = {
  AUTH: 'Auth',
  MAIN: 'Main',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  VERIFY_OTP: 'VerifyOTP',
  CHANGE_PASSWORD: 'ChangePassword',
  DASHBOARD: 'Dashboard',
} as const;

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Housekeeping Service',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  DEVICE_TYPE: 'MOBILE' as const,
  DEFAULT_LANGUAGE: 'vi',
  SUPPORTED_LANGUAGES: ['vi', 'en'],
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  OTP_LENGTH: 6,
  PHONE_REGEX: /^[0-9]{10,11}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// UI Constants - Enhanced spacing and typography
export const UI = {
  SCREEN_PADDING: 20,
  SECTION_PADDING: 16,
  CARD_PADDING: 16,
  BORDER_RADIUS: {
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    full: 9999,
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  TYPOGRAPHY: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  ANIMATION_DURATION: 300,
  SPLASH_DELAY: 2000,
  ELEVATION: {
    small: 2,
    medium: 4,
    large: 8,
  },
  SHADOW: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};
