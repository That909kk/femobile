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
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { COLORS, UI, VALIDATION } from '../../constants';
import { colors, typography, spacing, borderRadius, shadows, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';
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
      newErrors.email = staticData?.messages?.validation?.email_required || 'Vui lòng nhập email';
    } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
      newErrors.email = staticData?.messages?.validation?.email_invalid || 'Định dạng email không hợp lệ';
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
        staticData?.messages?.send_success || 'Mã xác thực đã được gửi đến email của bạn',
        [
          {
            text: staticData?.messages?.alert_ok || 'Đồng ý',
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
        err.message || staticData?.messages?.send_error || 'Gửi mã xác thực thất bại',
        [{ text: staticData?.messages?.alert_ok || 'Đồng ý' }]
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="lock-closed" size={responsive.moderateScale(36)} color={colors.highlight.teal} />
            </View>
            <Text style={styles.title}>{staticData.title}</Text>
            <Text style={styles.subtitle}>{staticData.subtitle}</Text>
          </View>

          <View style={styles.formCard}>
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
                <Ionicons name="alert-circle" size={responsive.moderateScale(20)} color={colors.feedback.error} />
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
    paddingHorizontal: responsiveSpacing.md,
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
