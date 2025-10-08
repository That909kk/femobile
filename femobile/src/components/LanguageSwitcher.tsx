import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useLanguageContext } from '../contexts/LanguageContext';
import { COLORS, UI } from '../constants';

interface LanguageSwitcherProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'minimal' | 'bordered';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  size = 'medium',
  showText = false,
  variant = 'default',
}) => {
  const { language, setLanguage, loading } = useLanguageContext();

  const handleToggleLanguage = async () => {
    if (loading) return;
    
    try {
      const newLang = language === 'vi' ? 'en' : 'vi';
      await setLanguage(newLang);
    } catch (error) {
      console.warn('Failed to change language:', error);
    }
  };

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    if (variant === 'minimal') {
      baseStyle.push(styles.buttonMinimal);
    } else if (variant === 'bordered') {
      baseStyle.push(styles.buttonBordered);
    } else {
      baseStyle.push(styles.buttonDefault);
    }
    
    if (size === 'small') {
      baseStyle.push(styles.buttonSmall);
    } else if (size === 'large') {
      baseStyle.push(styles.buttonLarge);
    } else {
      baseStyle.push(styles.buttonMedium);
    }
    
    return baseStyle;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];
    
    if (size === 'small') {
      baseStyle.push(styles.textSmall);
    } else if (size === 'large') {
      baseStyle.push(styles.textLarge);
    }
    
    return baseStyle;
  };

  const getCurrentLanguageLabel = () => {
    // Show the language we will switch TO, not current language
    return language === 'vi' ? 'EN' : 'VI';
  };

  const getFlagIcon = () => {
    // Show the flag of the language we will switch TO
    // If current is Vietnamese, show British flag (to switch to English)
    // If current is English, show Vietnamese flag (to switch to Vietnamese)
    return language === 'vi' ? '🇬🇧' : '🇻🇳';
  };  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleToggleLanguage}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityLabel={`Switch to ${language === 'vi' ? 'English' : 'Vietnamese'}`}
      accessibilityHint="Tap to change language"
    >
      <View style={styles.content}>
        <Text style={[styles.flag, { fontSize: getIconSize() }]}>
          {getFlagIcon()}
        </Text>
        {showText && (
          <Text style={getTextStyle()}>
            {getCurrentLanguageLabel()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: UI.BORDER_RADIUS.small,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  buttonDefault: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonMinimal: {
    backgroundColor: 'transparent',
  },
  buttonBordered: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 32,
    minHeight: 32,
  },
  buttonMedium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 48,
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: {
    lineHeight: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  text: {
    fontWeight: '500',
    color: COLORS.text.primary,
    fontSize: 14,
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
});
