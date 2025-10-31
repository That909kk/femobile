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
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { COLORS, UI, VALIDATION } from '../../constants';
import { colors, typography, spacing, borderRadius, shadows, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';
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
      newErrors.otp = staticData?.messages?.validation?.otp_required || 'Vui lòng nhập mã OTP';
    } else if (otp.length !== VALIDATION.OTP_LENGTH) {
      newErrors.otp = staticData?.messages?.validation?.otp_invalid || 'Mã OTP phải có 6 chữ số';
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
        staticData?.messages?.verify_success || 'Xác thực thành công!',
        [
          {
            text: staticData?.messages?.alert_ok || 'Đồng ý',
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
        err.message || staticData?.messages?.verify_error || 'Xác thực thất bại',
        [{ text: staticData?.messages?.alert_ok || 'Đồng ý' }]
      );
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(email);
      setCountdown(300); // Reset countdown
      
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.resend_success || 'Mã OTP mới đã được gửi',
        [{ text: staticData?.messages?.alert_ok || 'Đồng ý' }]
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.resend_error || 'Gửi lại mã OTP thất bại',
        [{ text: staticData?.messages?.alert_ok || 'Đồng ý' }]
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="key" size={responsive.moderateScale(36)} color={colors.highlight.teal} />
            </View>
            <Text style={styles.title}>{staticData.title}</Text>
            <Text style={styles.subtitle}>{staticData.subtitle}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.formCard}>
            <Input
              label={staticData.form.otp.label}
              value={otp}
              onChangeText={handleInputChange}
              placeholder={staticData.form.otp.placeholder}
              keyboardType="numeric"
              error={errors.otp}
              leftIcon="keypad"
            />

            {countdown > 0 && (
              <View style={styles.countdownContainer}>
                <Ionicons name="time-outline" size={responsive.moderateScale(16)} color={colors.neutral.textSecondary} />
                <Text style={styles.countdownText}>
                  {staticData.messages.expires_in} {formatCountdown(countdown)}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={responsive.moderateScale(20)} color={colors.feedback.error} />
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
                variant="ghost"
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
    backgroundColor: colors.neutral.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.xl,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.xl,
  },
  logoCircle: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
    ...shadows.card,
  },
  title: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  subtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  emailText: {
    fontSize: responsiveFontSize.body,
    color: colors.highlight.teal,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(borderRadius.card),
    padding: responsiveSpacing.lg,
    ...shadows.card,
  },
  buttonContainer: {
    marginBottom: responsiveSpacing.md,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warm.beige,
    padding: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(borderRadius.input),
    marginBottom: responsiveSpacing.md,
  },
  countdownText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginLeft: responsiveSpacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.feedback.error + '10',
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(borderRadius.input),
    marginBottom: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: colors.feedback.error + '20',
  },
  errorText: {
    color: colors.feedback.error,
    fontSize: responsiveFontSize.caption,
    marginLeft: responsiveSpacing.sm,
    textAlign: 'center',
  },
});

export default VerifyOTPScreen;
