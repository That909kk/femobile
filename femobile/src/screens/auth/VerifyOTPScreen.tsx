import React, { useState, useEffect } from 'react';
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

type VerifyOTPScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerifyOTP'>;
type VerifyOTPScreenRouteProp = RouteProp<RootStackParamList, 'VerifyOTP'>;

interface Props {
  navigation: VerifyOTPScreenNavigationProp;
  route: VerifyOTPScreenRouteProp;
}

export const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, type } = route.params;
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(300); // 5 minutes
  
  const { verifyOTP, resendOTP, loading, error } = useAuth();
  const { data: staticData } = useStaticData('verify-otp');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!otp.trim()) {
      newErrors.otp = staticData?.messages?.validation?.otp_required || 'OTP is required';
    } else if (otp.length !== VALIDATION.OTP_LENGTH) {
      newErrors.otp = staticData?.messages?.validation?.otp_invalid || 'OTP must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOTP = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await verifyOTP({ email, otp: otp.trim() });
      
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.verify_success || 'Verification successful!',
        [
          {
            text: staticData?.messages?.alert_ok || 'OK',
            onPress: () => {
              if (type === 'forgot-password') {
                navigation.navigate('ResetPassword', { email });
              } else {
                navigation.navigate('Login');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.verify_error || 'Verification failed',
        [{ text: staticData?.messages?.alert_ok || 'OK' }]
      );
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(email);
      setCountdown(300); // Reset countdown
      
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.resend_success || 'New OTP code sent',
        [{ text: staticData?.messages?.alert_ok || 'OK' }]
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.resend_error || 'Failed to resend OTP',
        [{ text: staticData?.messages?.alert_ok || 'OK' }]
      );
    }
  };

  const handleInputChange = (value: string) => {
    // Only allow numbers and limit to OTP length
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, VALIDATION.OTP_LENGTH);
    setOtp(numericValue);
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label={staticData.form.otp.label}
              value={otp}
              onChangeText={handleInputChange}
              placeholder={staticData.form.otp.placeholder}
              keyboardType="numeric"
              error={errors.otp}
              leftIcon="key"
            />

            {countdown > 0 && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>
                  {staticData.messages.expires_in} {formatCountdown(countdown)}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? staticData.actions.verifying : staticData.actions.verify}
                onPress={handleVerifyOTP}
                loading={loading}
                fullWidth
                size="large"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? staticData.actions.resending : staticData.actions.resend}
                onPress={handleResendOTP}
                variant="outline"
                fullWidth
                disabled={countdown > 0 || loading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={staticData.actions.back}
                onPress={() => navigation.goBack()}
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
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 14,
    color: COLORS.text.secondary,
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
