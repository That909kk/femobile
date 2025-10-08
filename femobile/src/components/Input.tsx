import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, UI } from '../constants';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  blurOnSubmit?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onSubmitEditing,
  returnKeyType = 'done',
  blurOnSubmit = true,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handlePasswordToggle = () => {
    if (secureTextEntry) {
      setIsPasswordVisible(!isPasswordVisible);
    }
    onRightIconPress?.();
  };

  const getInputContainerStyle = () => {
    const baseStyle: any[] = [styles.inputContainer];
    
    if (isFocused) {
      baseStyle.push(styles.focusedInputContainer);
    }
    
    if (error) {
      baseStyle.push(styles.errorInputContainer);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledInputContainer);
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle: any[] = [styles.input];
    
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }
    
    if (rightIcon || secureTextEntry) {
      baseStyle.push(styles.inputWithRightIcon);
    }
    
    if (multiline) {
      baseStyle.push(styles.multilineInput);
    }
    
    return baseStyle;
  };

  const getRightIcon = () => {
    if (secureTextEntry) {
      return isPasswordVisible ? 'eye-off' : 'eye';
    }
    return rightIcon;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={COLORS.text.secondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          ref={ref}
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.disabled}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={handlePasswordToggle}
            style={styles.rightIconButton}
            disabled={!secureTextEntry && !onRightIconPress}
          >
            <Ionicons
              name={getRightIcon() as any}
              size={20}
              color={COLORS.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  focusedInputContainer: {
    borderColor: COLORS.primary,
  },
  errorInputContainer: {
    borderColor: COLORS.error,
  },
  disabledInputContainer: {
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
});
