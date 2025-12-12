import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { useEmailOtp } from '../../hooks/useEmailOtp';
import { useStaticData } from '../../hooks/useStaticData';
import { VALIDATION } from '../../constants';
import { colors, typography, spacing, borderRadius, shadows, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';
import type { RootStackParamList } from '../../types/auth';

type VerifyOTPScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerifyOTP'>;
type VerifyOTPScreenRouteProp = RouteProp<RootStackParamList, 'VerifyOTP'>;

interface Props {
  navigation: VerifyOTPScreenNavigationProp;
  route: VerifyOTPScreenRouteProp;
}

export const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, type, fromLogin } = route.params as {
    email: string;
    type: 'register' | 'forgot-password';
    fromLogin?: boolean;
  };
  
  // OTP state - 6 separate inputs like web
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVerified, setIsVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // Input refs for auto-focus navigation
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const {
    loading,
    error,
    successMessage,
    cooldownSeconds,
    expirationSeconds,
    canResend,
    sendOtp,
    verifyOtp,
    checkCooldown,
    clearError,
    clearSuccessMessage
  } = useEmailOtp();
  
  const { data: staticData } = useStaticData('verify-otp');

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigation.navigate('Register');
    }
  }, [email, navigation]);

  // Send OTP on mount
  useEffect(() => {
    if (email && !isOtpSent) {
      sendOtp(email)
        .then(() => {
          setIsOtpSent(true);
        })
        .catch((err) => {
          console.error('Failed to send initial OTP:', err);
          setIsOtpSent(true);
          // Check cooldown if error
          if (err.response?.status === 429 || err.response?.status === 400) {
            checkCooldown(email);
          }
        });
    }
  }, [email, sendOtp, isOtpSent, checkCooldown]);

  // Redirect after successful verification
  useEffect(() => {
    if (isVerified) {
      // Hiển thị ngay alert thành công và chuyển hướng về Login
      const timer = setTimeout(() => {
        if (type === 'forgot-password') {
          navigation.navigate('ResetPassword', { email });
        } else {
          // Từ register hoặc login verification - chuyển về trang đăng nhập
          Alert.alert(
            staticData?.messages?.success_title || 'Thành công',
            staticData?.messages?.verification_complete || 'Xác thực email thành công! Vui lòng đăng nhập lại.',
            [
              {
                text: staticData?.messages?.alert_ok || 'Đăng nhập ngay',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
        }
      }, 500); // Giảm thời gian chờ xuống 500ms
      return () => clearTimeout(timer);
    }
  }, [isVerified, navigation, type, email, staticData, fromLogin]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({});
    clearError();
    
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press for backspace navigation
  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== VALIDATION.OTP_LENGTH) {
      setErrors({ otp: staticData?.messages?.otp_incomplete || 'Vui lòng nhập đầy đủ mã OTP' });
      return;
    }

    try {
      const response = await verifyOtp(email, otpCode);
      
      if (response.success) {
        setIsVerified(true);
        // Alert sẽ được hiển thị trong useEffect sau khi setIsVerified
      }
    } catch (err: any) {
      setErrors({ otp: err.message || staticData?.messages?.verify_error || 'Mã OTP không hợp lệ' });
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      await sendOtp(email);
      setOtp(['', '', '', '', '', '']);
      Alert.alert(
        staticData?.messages?.success_title || 'Thành công',
        staticData?.messages?.resend_success || 'Mã OTP mới đã được gửi đến email của bạn'
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.error_title || 'Lỗi',
        err.message || staticData?.messages?.resend_error || 'Gửi lại mã OTP thất bại'
      );
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
    <LinearGradient
      colors={['#E8F5F3', '#F0F9FF', '#FFFFFF']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={responsive.moderateScale(24)} color={colors.primary.navy} />
              </TouchableOpacity>
              
              <LinearGradient
                colors={[colors.highlight.teal, '#16C9B5']}
                style={styles.logoCircle}
              >
                <Ionicons name="mail" size={responsive.moderateScale(40)} color={colors.neutral.white} />
              </LinearGradient>
              
              <Text style={styles.title}>{staticData.title || 'Xác thực Email'}</Text>
              <Text style={styles.subtitle}>
                {staticData.subtitle || 'Nhập mã OTP đã được gửi đến email của bạn'}
              </Text>
              <View style={styles.emailContainer}>
                <Ionicons name="mail-outline" size={responsive.moderateScale(16)} color={colors.highlight.teal} />
                <Text style={styles.emailText}>{email}</Text>
              </View>
            </View>

            {/* OTP Input */}
            <LinearGradient
              colors={['#FFFFFF', '#FEFEFE']}
              style={styles.formCard}
            >
              <Text style={styles.inputLabel}>
                {staticData.form?.otp?.label || 'Nhập mã xác thực'}
              </Text>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : null,
                      errors.otp ? styles.otpInputError : null,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              
              {errors.otp && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={responsive.moderateScale(16)} color={colors.feedback.error} />
                  <Text style={styles.errorText}>{errors.otp}</Text>
                </View>
              )}

              {error && !errors.otp && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={responsive.moderateScale(16)} color={colors.feedback.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Timer Info */}
              <View style={styles.timerContainer}>
                {expirationSeconds > 0 && (
                  <View style={styles.timerItem}>
                    <Ionicons name="time-outline" size={responsive.moderateScale(16)} color={colors.neutral.textSecondary} />
                    <Text style={styles.timerText}>
                      OTP hết hạn sau: <Text style={styles.timerValue}>{formatTime(expirationSeconds)}</Text>
                    </Text>
                  </View>
                )}
                
                {cooldownSeconds > 0 && (
                  <View style={styles.timerItem}>
                    <Ionicons name="refresh" size={responsive.moderateScale(16)} color={colors.neutral.textSecondary} />
                    <Text style={styles.timerText}>
                      Gửi lại sau: <Text style={styles.timerValue}>{formatTime(cooldownSeconds)}</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* Success Message */}
              {successMessage && !error && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={responsive.moderateScale(16)} color={colors.feedback.success} />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Verified Success State */}
              {isVerified && (
                <View style={styles.verifiedContainer}>
                  <LinearGradient
                    colors={[colors.feedback.success, '#28A745']}
                    style={styles.verifiedIcon}
                  >
                    <Ionicons name="checkmark" size={responsive.moderateScale(32)} color={colors.neutral.white} />
                  </LinearGradient>
                  <Text style={styles.verifiedText}>
                    {staticData.messages?.verified || 'Xác thực thành công!'}
                  </Text>
                  <Text style={styles.verifiedSubtext}>
                    {staticData.messages?.redirecting || 'Đang chuyển hướng...'}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              {!isVerified && (
                <>
                  <View style={styles.buttonContainer}>
                    <Button
                      title={loading ? (staticData.actions?.verifying || 'Đang xác thực...') : (staticData.actions?.verify || 'Xác thực')}
                      onPress={handleVerifyOTP}
                      loading={loading}
                      gradient={true}
                      fullWidth
                      size="large"
                      disabled={otp.join('').length !== 6}
                    />
                  </View>

                  <View style={styles.resendContainer}>
                    <Text style={styles.resendLabel}>
                      {staticData.messages?.no_code || 'Không nhận được mã?'}
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={!canResend || loading}
                      style={[styles.resendButton, (!canResend || loading) && styles.resendButtonDisabled]}
                    >
                      <Text style={[
                        styles.resendButtonText,
                        (!canResend || loading) && styles.resendButtonTextDisabled
                      ]}>
                        {loading ? (staticData.actions?.resending || 'Đang gửi...') : (staticData.actions?.resend || 'Gửi lại mã')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </LinearGradient>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Ionicons name="information-circle-outline" size={responsive.moderateScale(20)} color={colors.neutral.textSecondary} />
              <Text style={styles.helpText}>
                {staticData.messages?.help || 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến và thư rác.'}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.xl,
    paddingTop: responsiveSpacing.md,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: responsiveSpacing.md,
    padding: responsiveSpacing.sm,
  },
  logoCircle: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
    ...shadows.card,
  },
  title: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight.teal + '15',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(borderRadius.input),
  },
  emailText: {
    fontSize: responsiveFontSize.body,
    color: colors.highlight.teal,
    fontWeight: '600',
    marginLeft: responsiveSpacing.sm,
  },
  
  // Form Card
  formCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(borderRadius.card),
    padding: responsiveSpacing.xl,
    marginBottom: responsiveSpacing.lg,
    ...shadows.card,
  },
  inputLabel: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
    textAlign: 'center',
  },
  
  // OTP Inputs
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveSpacing.lg,
  },
  otpInput: {
    width: responsive.moderateScale(45),
    height: responsive.moderateScale(55),
    borderWidth: 2,
    borderColor: colors.neutral.border,
    borderRadius: responsive.moderateScale(borderRadius.input),
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
    textAlign: 'center',
    backgroundColor: colors.neutral.white,
  },
  otpInputFilled: {
    borderColor: colors.highlight.teal,
    backgroundColor: colors.highlight.teal + '10',
  },
  otpInputError: {
    borderColor: colors.feedback.error,
    backgroundColor: colors.feedback.error + '10',
  },
  
  // Error & Success
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.feedback.error + '10',
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(borderRadius.input),
    marginBottom: responsiveSpacing.md,
  },
  errorText: {
    color: colors.feedback.error,
    fontSize: responsiveFontSize.caption,
    marginLeft: responsiveSpacing.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.feedback.success + '10',
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(borderRadius.input),
    marginBottom: responsiveSpacing.md,
  },
  successText: {
    color: colors.feedback.success,
    fontSize: responsiveFontSize.caption,
    marginLeft: responsiveSpacing.sm,
  },
  
  // Timer
  timerContainer: {
    marginBottom: responsiveSpacing.md,
  },
  timerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveSpacing.xs,
  },
  timerText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginLeft: responsiveSpacing.xs,
  },
  timerValue: {
    fontWeight: '600',
    color: colors.highlight.teal,
  },
  
  // Verified State
  verifiedContainer: {
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xl,
  },
  verifiedIcon: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
  },
  verifiedText: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.feedback.success,
    marginBottom: responsiveSpacing.xs,
  },
  verifiedSubtext: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  
  // Buttons
  buttonContainer: {
    marginBottom: responsiveSpacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  resendButton: {
    marginLeft: responsiveSpacing.xs,
    padding: responsiveSpacing.xs,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.highlight.teal,
  },
  resendButtonTextDisabled: {
    color: colors.neutral.textSecondary,
  },
  
  // Help
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warm.beige + '50',
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(borderRadius.input),
  },
  helpText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginLeft: responsiveSpacing.sm,
    lineHeight: responsive.moderateScale(18),
  },
});

export default VerifyOTPScreen;
