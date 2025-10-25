import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Design base dimensions (iPhone 14 Pro)
const baseWidth = 390;
const baseHeight = 844;

// Scale functions
export const scale = (size: number): number => {
  return (screenWidth / baseWidth) * size;
};

export const verticalScale = (size: number): number => {
  return (screenHeight / baseHeight) * size;
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Screen dimensions
export const screenDimensions = {
  width: screenWidth,
  height: screenHeight,
  isSmallScreen: screenWidth <= 375,
  isMediumScreen: screenWidth > 375 && screenWidth <= 414,
  isLargeScreen: screenWidth > 414,
  isTablet: screenWidth >= 768,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

// Status bar height for different devices
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    // For iOS with notch
    if (screenHeight >= 812) return 47;
    // For iOS without notch
    return 20;
  }
  
  // For Android
  return StatusBar.currentHeight || 24;
};

// Safe area padding
export const getSafeAreaPadding = () => ({
  paddingTop: getStatusBarHeight(),
  paddingBottom: Platform.OS === 'ios' && screenHeight >= 812 ? 34 : 0,
});

// Responsive spacing
export const responsiveSpacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
};

// Responsive font sizes
export const responsiveFontSize = {
  caption: moderateScale(12),
  body: moderateScale(14),
  bodyLarge: moderateScale(16),
  heading3: moderateScale(18),
  heading2: moderateScale(20),
  heading1: moderateScale(24),
  display: moderateScale(28),
};

// Grid system
export const getGridItemWidth = (columns: number, spacing: number = responsiveSpacing.md): number => {
  const totalSpacing = spacing * (columns + 1);
  return (screenWidth - totalSpacing) / columns;
};

// Responsive image sizes
export const getImageSize = (baseSize: number): { width: number; height: number } => ({
  width: moderateScale(baseSize),
  height: moderateScale(baseSize),
});

// Device-specific adjustments
export const deviceAdjustments = {
  cardPadding: screenDimensions.isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md,
  buttonHeight: moderateScale(48),
  inputHeight: moderateScale(50),
  headerHeight: moderateScale(60),
  tabBarHeight: moderateScale(60) + (Platform.OS === 'ios' && screenHeight >= 812 ? 34 : 0),
};

export default {
  scale,
  verticalScale,
  moderateScale,
  screenDimensions,
  getStatusBarHeight,
  getSafeAreaPadding,
  responsiveSpacing,
  responsiveFontSize,
  getGridItemWidth,
  getImageSize,
  deviceAdjustments,
};