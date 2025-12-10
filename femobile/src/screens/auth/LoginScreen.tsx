import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { authService } from '../../services/authService';
import { COLORS, UI, VALIDATION, RESPONSIVE } from '../../constants';
import { vietnameseTextStyles } from '../../styles/vietnamese-text';
import { colors, typography, spacing, borderRadius, shadows, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';
import type { RootStackParamList, UserRole, CustomerData } from '../../types/auth';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  
  // Refs for input fields
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  
  const { login, loading, error } = useAuth();
  const { data: staticData } = useStaticData('login');



  const handleLogin = async () => {
    // Validate only username and password first
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = staticData?.messages?.validation?.username_required || 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = staticData?.messages?.validation?.username_min_length || `Tên đăng nhập phải có ít nhất ${VALIDATION.USERNAME_MIN_LENGTH} ký tự`;
    }
    
    if (!formData.password.trim()) {
      newErrors.password = staticData?.messages?.validation?.password_required || 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = staticData?.messages?.validation?.password_min_length || `Mật khẩu phải có ít nhất ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // First, get user roles
      const rolesResponse = await authService.getRoles({
        username: formData.username.trim(),
        password: formData.password,
      });

      if (!rolesResponse.success) {
        // Map error messages to user-friendly messages
        let errorMessage = rolesResponse.message || 'Thông tin đăng nhập không hợp lệ';
        
        // Map specific API messages to user-friendly messages
        if (rolesResponse.message === 'Thông tin đăng nhập không hợp lệ') {
          errorMessage = staticData?.messages?.invalid_credentials || 'Tên đăng nhập hoặc mật khẩu không chính xác';
        } else if (rolesResponse.message === 'Tài khoản chưa được kích hoạt hoặc đã bị khóa') {
          errorMessage = staticData?.messages?.account_inactive || 'Tài khoản chưa được kích hoạt hoặc đã bị khóa';
        } else if (rolesResponse.message === 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần') {
          errorMessage = staticData?.messages?.account_locked || 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.';
        }
        
        Alert.alert(
          staticData?.messages?.alert_error || 'Lỗi',
          errorMessage,
          [{ text: staticData?.messages?.alert_ok || 'OK' }]
        );
        return;
      }

      // Check number of active roles  
      const rolesData = rolesResponse.data || {};
      const activeRoles = Object.entries(rolesData || {})
        .filter(([_, status]) => status === 'ACTIVE')
        .map(([role, _]) => role);

      if (activeRoles.length === 0) {
        Alert.alert(
          staticData?.messages?.alert_error || 'Lỗi',
          'Tài khoản chưa được kích hoạt hoặc đã bị khóa',
          [{ text: staticData?.messages?.alert_ok || 'OK' }]
        );
        return;
      }

      // Check if user has ADMIN role - mobile app doesn't support ADMIN role
      if (activeRoles.includes('ADMIN')) {
        Alert.alert(
          staticData?.messages?.alert_info || 'Thông báo',
          staticData?.messages?.admin_not_supported || 'Ứng dụng không hỗ trợ cho vai trò ADMIN. Vui lòng đăng nhập tại homemate.io.vn',
          [
            {
              text: staticData?.messages?.alert_ok || 'Đồng ý',
              style: 'default'
            }
          ]
        );
        return;
      }

      if (activeRoles.length === 1) {
        // Only one role, login directly
        const singleRole = activeRoles[0] as UserRole;
        const loginResult = await login({
          username: formData.username.trim(),
          password: formData.password,
          role: singleRole,
          deviceType: 'MOBILE',
        });
        
        // Kiểm tra nếu cần xác thực email (tương tự web)
        if (loginResult && typeof loginResult === 'object' && 'requireEmailVerification' in loginResult) {
          const result = loginResult as { requireEmailVerification?: boolean; email?: string };
          if (result.requireEmailVerification && result.email) {
            Alert.alert(
              staticData?.messages?.alert_info || 'Thông báo',
              staticData?.messages?.email_not_verified || 'Email của bạn chưa được xác thực. Vui lòng xác thực để tiếp tục.',
              [
                {
                  text: staticData?.messages?.alert_ok || 'Xác thực ngay',
                  onPress: () => navigation.navigate('VerifyOTP', {
                    email: result.email!,
                    type: 'register',
                    fromLogin: true,
                  }),
                },
              ]
            );
            return;
          }
        }
        
        // No alert needed, navigation will happen automatically
      } else {
        // Multiple roles, navigate to role selection screen
        navigation.navigate('RoleSelection' as any, {
          username: formData.username.trim(),
          password: formData.password,
          availableRoles: rolesData,
        });
      }
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.login_error || 'Đăng nhập thất bại',
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
            {/* Header with Logo */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[colors.highlight.teal, '#16C9B5']}
                  style={styles.logoCircle}
                >
                  <Ionicons name="home" size={responsive.moderateScale(40)} color={colors.neutral.white} />
                </LinearGradient>
                <Text style={styles.brandName}>{staticData?.brand?.name || 'Home Mate'}</Text>
                <Text style={styles.brandTagline}>{staticData?.brand?.tagline || 'Nền tảng giúp việc gia đình chuyên nghiệp'}</Text>
              </View>
              
              <View style={styles.welcomeContainer}>
                <Text style={styles.title}>{staticData.title}</Text>
                <Text style={styles.subtitle}>{staticData.subtitle}</Text>
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#FEFEFE']}
                style={styles.formCard}
              >
                <Input
                  label={staticData.form.username.label}
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  placeholder={staticData.form.username.placeholder}
                  autoCapitalize="none"
                  error={errors.username}
                  leftIcon="person"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />

                <Input
                  ref={passwordRef}
                  label={staticData.form.password.label}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder={staticData.form.password.placeholder}
                  secureTextEntry
                  error={errors.password}
                  leftIcon="lock-closed"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                {error && (
                  <LinearGradient
                    colors={['#FFE8E8', '#FFF0F0']}
                    style={styles.errorContainer}
                  >
                    <Ionicons name="alert-circle" size={responsive.moderateScale(20)} color={colors.feedback.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </LinearGradient>
                )}

                <View style={styles.buttonContainer}>
                  <Button
                    title={loading ? staticData.actions.logging_in : staticData.actions.login}
                    onPress={handleLogin}
                    loading={loading}
                    gradient={true}
                    fullWidth
                    size="large"
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    title={staticData.actions.forgot_password}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    variant="ghost"
                    fullWidth
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {staticData.messages.no_account}
              </Text>
              <Button
                title={staticData.messages.register_link}
                onPress={() => navigation.navigate('Register')}
                variant="outline"
                size="medium"
              />
            </View>

            {/* Service Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <LinearGradient
                  colors={['#1BB5A6', '#16C9B5']}
                  style={styles.featureIconContainer}
                >
                  <Ionicons name="shield-checkmark" size={responsive.moderateScale(20)} color={colors.neutral.white} />
                </LinearGradient>
                <Text style={styles.featureText}>{staticData?.features?.trusted || 'Tin cậy & An toàn'}</Text>
              </View>
              <View style={styles.featureItem}>
                <LinearGradient
                  colors={['#1BB5A6', '#16C9B5']}
                  style={styles.featureIconContainer}
                >
                  <Ionicons name="time" size={responsive.moderateScale(20)} color={colors.neutral.white} />
                </LinearGradient>
                <Text style={styles.featureText}>{staticData?.features?.on_time || 'Đúng giờ'}</Text>
              </View>
              <View style={styles.featureItem}>
                <LinearGradient
                  colors={['#1BB5A6', '#16C9B5']}
                  style={styles.featureIconContainer}
                >
                  <Ionicons name="star" size={responsive.moderateScale(20)} color={colors.neutral.white} />
                </LinearGradient>
                <Text style={styles.featureText}>{staticData?.features?.quality || 'Chất lượng cao'}</Text>
              </View>
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
    paddingBottom: responsiveSpacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header Styles
  headerContainer: {
    alignItems: 'center',
    marginTop: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  logoCircle: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
    ...shadows.card,
  },
  brandName: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  brandTagline: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  
  // Form Styles
  formContainer: {
    marginBottom: responsiveSpacing.xl,
  },
  formCard: {
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
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(borderRadius.input),
    marginBottom: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  errorText: {
    color: colors.feedback.error,
    fontSize: responsiveFontSize.caption,
    marginLeft: responsiveSpacing.sm,
    flex: 1,
  },
  
  // Footer Styles
  footerContainer: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.xl,
  },
  footerText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.md,
    textAlign: 'center',
  },
  
  // Features Styles
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: responsiveSpacing.lg,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconContainer: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
    ...shadows.button,
  },
  featureText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
