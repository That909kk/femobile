import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, UI } from '../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  gradient?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  gradient = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Rotating animation for loading spinner
  useEffect(() => {
    if (loading) {
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [loading, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'medium':
        baseStyle.push(styles.mediumButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
    }
    
    // Variant styles (only for non-gradient buttons)
    if (!gradient) {
      switch (variant) {
        case 'primary':
          baseStyle.push(styles.primaryButton);
          break;
        case 'secondary':
          baseStyle.push(styles.secondaryButton);
          break;
        case 'outline':
          baseStyle.push(styles.outlineButton);
          break;
        case 'ghost':
          baseStyle.push(styles.ghostButton);
          break;
      }
    }
    
    // State styles
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidthButton);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.buttonText];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(gradient ? styles.gradientButtonText : styles.primaryButtonText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButtonText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButtonText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButtonText);
        break;
    }
    
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButtonText);
        break;
      case 'medium':
        baseStyle.push(styles.mediumButtonText);
        break;
      case 'large':
        baseStyle.push(styles.largeButtonText);
        break;
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButtonText);
    }
    
    return baseStyle;
  };

  const renderButtonContent = () => (
    <View style={styles.buttonContent}>
      {icon && !loading && <View style={styles.iconContainer}>{icon}</View>}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons
              name="sync-outline"
              size={size === 'large' ? 24 : size === 'small' ? 16 : 20}
              color={variant === 'primary' || gradient ? COLORS.text.inverse : COLORS.primary}
            />
          </Animated.View>
          <Text style={[getTextStyle(), styles.loadingText]}>{title}</Text>
        </View>
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </View>
  );

  if (gradient && variant === 'primary' && !disabled) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={COLORS.gradient.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[getButtonStyle(), styles.gradientButton]}
          >
            {renderButtonContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {renderButtonContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: UI.BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...UI.SHADOW.medium,
  },
  fullWidthButton: {
    width: '100%',
  },
  
  // Button content
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: UI.SPACING.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 4,
  },
  
  // Variant styles
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  gradientButton: {
    backgroundColor: 'transparent',
  },
  
  // Size styles
  smallButton: {
    paddingVertical: UI.SPACING.sm,
    paddingHorizontal: UI.SPACING.md,
    minHeight: 36,
  },
  mediumButton: {
    paddingVertical: UI.SPACING.md,
    paddingHorizontal: UI.SPACING.xl,
    minHeight: 48,
  },
  largeButton: {
    paddingVertical: UI.SPACING.lg,
    paddingHorizontal: UI.SPACING.xxl,
    minHeight: 56,
  },
  
  // State styles
  disabledButton: {
    opacity: 0.6,
  },
  
  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: COLORS.text.inverse,
  },
  secondaryButtonText: {
    color: COLORS.text.inverse,
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
  ghostButtonText: {
    color: COLORS.primary,
  },
  gradientButtonText: {
    color: COLORS.text.inverse,
  },
  smallButtonText: {
    fontSize: UI.TYPOGRAPHY.fontSize.sm,
  },
  mediumButtonText: {
    fontSize: UI.TYPOGRAPHY.fontSize.base,
  },
  largeButtonText: {
    fontSize: UI.TYPOGRAPHY.fontSize.lg,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});
