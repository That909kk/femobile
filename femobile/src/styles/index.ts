// Export responsive utilities
export { default as responsive } from './responsive';
export * from './responsive';

// Bảng màu nhận diện (navy – teal – beige)
export const colors = {
  primary: {
    navy: '#0F1C2D',
  },
  highlight: {
    teal: '#1BB5A6',
    purple: '#8B5CF6',
  },
  warm: {
    beige: '#F4EDE1',
  },
  neutral: {
    textPrimary: '#06111F',
    textSecondary: '#405065',
    label: '#92A3B5',
    border: '#E8ECEF',
    background: '#F8FAFB',
    white: '#FFFFFF',
  },
  feedback: {
    success: '#0E9F6E',
    warning: '#F6C343',
    error: '#D64545',
  },
};

// Typography system với Be Vietnam Pro
export const typography = {
  heading1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600' as const,
    fontFamily: 'BeVietnamPro-SemiBold',
  },
  heading2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,
    fontFamily: 'BeVietnamPro-Medium',
  },
  heading3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500' as const,
    fontFamily: 'BeVietnamPro-Medium',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
    fontFamily: 'BeVietnamPro-Regular',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: 'BeVietnamPro-Regular',
  },
};

// Spacing system với lưới 8px
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius theo chuẩn
export const borderRadius = {
  card: 16,
  button: 12,
  input: 8,
  small: 4,
};

// Shadow system
export const shadows = {
  card: {
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  button: {
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
};

// Layout constants
export const layout = {
  headerHeight: 56,
  tabBarHeight: 64,
  minHitArea: 48,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
};