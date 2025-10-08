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
import { Button, Input } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { COLORS, UI, VALIDATION } from '../../constants';
import type { RootStackParamList } from '../../types/auth';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { forgotPassword, loading, error } = useAuth();
  const { data: staticData } = useStaticData('forgot-password');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = staticData?.messages?.validation?.email_required || 'Email is required';
    } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
      newErrors.email = staticData?.messages?.validation?.email_invalid || 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await forgotPassword({ email: email.trim() });
      
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.send_success || 'Verification code sent to your email',
        [
          {
            text: staticData?.messages?.alert_ok || 'OK',
            onPress: () => navigation.navigate('VerifyOTP', {
              email: email.trim(),
              type: 'forgot-password',
            }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.send_error || 'Failed to send verification code',
        [{ text: staticData?.messages?.alert_ok || 'OK' }]
      );
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
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
              label={staticData.form.email.label}
              value={email}
              onChangeText={handleInputChange}
              placeholder={staticData.form.email.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon="mail"
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? staticData.actions.sending : staticData.actions.send_otp}
                onPress={handleSendOTP}
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
