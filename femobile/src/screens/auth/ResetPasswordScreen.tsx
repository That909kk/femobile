import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Button, Input } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { COLORS, UI, VALIDATION } from '../../constants';
import type { RootStackParamList } from '../../types/auth';

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

interface Props {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
}

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { resetPassword, loading, error } = useAuth();
  const { data: staticData } = useStaticData('reset-password');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = staticData?.messages?.validation?.password_required || 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = staticData?.messages?.validation?.password_length || 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = staticData?.messages?.validation?.confirm_password_required || 'Password confirmation is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = staticData?.messages?.validation?.passwords_not_match || 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword({
        email,
        otp: '', // OTP should be passed from previous screen or stored
        newPassword: formData.password,
      });
      
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.reset_success || 'Password reset successful!',
        [
          {
            text: staticData?.messages?.alert_ok || 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.reset_error || 'Password reset failed',
        [{ text: staticData?.messages?.alert_ok || 'OK' }]
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!staticData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{staticData.title}</Text>
            <Text style={styles.subtitle}>{staticData.subtitle}</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label={staticData.form.password.label}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder={staticData.form.password.placeholder}
              secureTextEntry
              error={errors.password}
              leftIcon="lock-closed"
            />

            <Input
              label={staticData.form.confirm_password.label}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder={staticData.form.confirm_password.placeholder}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon="lock-closed"
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? staticData.actions.resetting : staticData.actions.reset}
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                size="large"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={staticData.actions.back_to_login}
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                fullWidth
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: UI.SCREEN_PADDING,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
