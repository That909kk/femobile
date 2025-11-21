import Constants from 'expo-constants';
import { Platform, Dimensions } from 'react-native';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'http://localhost:8080/ws',
  TIMEOUT: 20000, // Increased from 10s to 20s to reduce timeout errors
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
  ONBOARDING_COMPLETED: 'onboardingCompleted',
};

// Colors - Vibrant, energetic cleaning service palette
export const COLORS = {
  // Primary - Vibrant Ocean Blue (Trust, Energy, Professional)
  primary: '#1E88E5', // Bright ocean blue
  primaryDark: '#1565C0', // Deep ocean blue
  primaryLight: '#42A5F5', // Light ocean blue
  
  // Secondary - Fresh Emerald Green (Nature, Clean, Fresh)
  secondary: '#26A69A', // Vibrant teal/emerald
  secondaryDark: '#00695C', // Deep teal
  secondaryLight: '#4DB6AC', // Light teal
  
  // Accent - Energetic Orange (Warmth, Energy, Action)
  accent: '#FF7043', // Vibrant coral orange
  accentDark: '#D84315', // Deep orange
  accentLight: '#FFAB91', // Light coral
  
  // Status colors - Bright and clear
  success: '#4CAF50', // Fresh green
  warning: '#FFC107', // Bright amber
  error: '#F44336', // Clear red
  info: '#29B6F6', // Bright sky blue
  
  // Backgrounds - Clean but warm
  background: '#F8F9FA', // Slightly warm white
  backgroundDark: '#F3F4F6', // Soft grey
  surface: '#FFFFFF', // Pure white
  surfaceElevated: '#F0F4F8', // Light blue-grey
  
  // Overlay with vibrant primary
  overlay: 'rgba(30, 136, 229, 0.15)',
  
  text: {
    primary: '#212121', // Dark charcoal (better contrast)
    secondary: '#616161', // Medium grey
    tertiary: '#9E9E9E', // Light grey
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
  
  // Borders - Subtle but defined
  border: '#E1E5E9', // Light blue-grey
  borderLight: '#F1F3F4',
  borderDark: '#C1C7CD',
  
  // Shadow with warmer tone
  shadow: 'rgba(33, 33, 33, 0.15)',
  
  // Vibrant gradients
  gradient: {
    primary: ['#42A5F5', '#1E88E5', '#1565C0'], // Ocean blue gradient
    secondary: ['#4DB6AC', '#26A69A', '#00695C'], // Emerald gradient
    accent: ['#FFAB91', '#FF7043', '#D84315'], // Coral gradient
    success: ['#81C784', '#4CAF50', '#388E3C'], // Green gradient
    sunset: ['#FF7043', '#FF5722', '#D84315'], // Sunset gradient
    ocean: ['#29B6F6', '#1E88E5', '#1565C0'], // Ocean gradient
    fresh: ['#4DB6AC', '#26A69A'], // Fresh gradient
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
  APP_NAME: 'Dịch Vụ Giúp Việc Gia Đình',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  DEVICE_TYPE: 'MOBILE' as const,
  DEFAULT_LANGUAGE: 'vi',
  SUPPORTED_LANGUAGES: ['vi'],
};

// Responsive Design System
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const RESPONSIVE = {
  // Screen dimensions
  SCREEN_WIDTH: screenWidth,
  SCREEN_HEIGHT: screenHeight,
  
  // Device types based on screen height
  isSmallScreen: screenHeight < 700,    // iPhone SE, small Android
  isMediumScreen: screenHeight >= 700 && screenHeight < 800,  // iPhone 12/13 mini
  isLargeScreen: screenHeight >= 800 && screenHeight < 900,   // iPhone 12/13/14
  isXLargeScreen: screenHeight >= 900,  // iPhone 14 Plus/Pro Max, large Android
  
  // Dynamic scaling functions
  scale: (size: number) => {
    if (screenHeight < 700) return size * 0.8;      // Small screens: 80%
    if (screenHeight < 800) return size * 0.9;      // Medium screens: 90%
    if (screenHeight < 900) return size;            // Large screens: 100%
    return size * 1.1;                              // XL screens: 110%
  },
  
  // Vertical spacing based on screen height
  verticalScale: (size: number) => {
    const baseHeight = 800; // iPhone 12/13 as base
    return (screenHeight / baseHeight) * size;
  },
  
  // Font scaling
  fontSize: (size: number) => {
    if (screenHeight < 700) return size * 0.85;     // Smaller fonts for small screens
    if (screenHeight < 800) return size * 0.95;     // Slightly smaller for medium
    return size;                                     // Normal for large+
  },
  
  // Adaptive spacing
  spacing: {
    xs: screenHeight < 700 ? 2 : 4,
    sm: screenHeight < 700 ? 4 : 8,
    md: screenHeight < 700 ? 6 : 12,
    lg: screenHeight < 700 ? 8 : 16,
    xl: screenHeight < 700 ? 12 : 20,
    xxl: screenHeight < 700 ? 16 : 24,
    xxxl: screenHeight < 700 ? 20 : 32,
  },
  
  // Adaptive component sizes
  components: {
    logo: {
      size: screenHeight < 700 ? 48 : screenHeight < 800 ? 56 : 64,
      iconSize: screenHeight < 700 ? 24 : screenHeight < 800 ? 28 : 32,
    },
    button: {
      height: screenHeight < 700 ? 40 : screenHeight < 800 ? 44 : 48,
      padding: screenHeight < 700 ? 12 : screenHeight < 800 ? 16 : 20,
    },
    form: {
      padding: screenHeight < 700 ? 16 : screenHeight < 800 ? 18 : 20,
      spacing: screenHeight < 700 ? 10 : screenHeight < 800 ? 12 : 14,
    },
    features: {
      iconSize: screenHeight < 700 ? 32 : screenHeight < 800 ? 36 : 40,
      iconInnerSize: screenHeight < 700 ? 16 : screenHeight < 800 ? 18 : 20,
    }
  }
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
    fontFamily: {
      // Primary Vietnamese font family with fallbacks
      primary: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      // For better Vietnamese character support
      vietnamese: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    },
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
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
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
      shadowColor: 'rgba(30, 56, 89, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    medium: {
      shadowColor: 'rgba(30, 56, 89, 0.12)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 6,
    },
    large: {
      shadowColor: 'rgba(30, 56, 89, 0.16)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};
