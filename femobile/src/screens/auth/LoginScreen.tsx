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
import type { RootStackParamList, UserRole } from '../../types/auth';

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
      newErrors.username = staticData?.messages?.validation?.username_required || 'Username is required';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = staticData?.messages?.validation?.username_min_length || `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`;
    }
    
    if (!formData.password.trim()) {
      newErrors.password = staticData?.messages?.validation?.password_required || 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = staticData?.messages?.validation?.password_min_length || `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
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
          staticData?.messages?.admin_not_supported || 'Ứng dụng di động không hỗ trợ vai trò ADMIN. Vui lòng sử dụng trang web.',
          [
            {
              text: staticData?.messages?.back || 'Quay lại',
              onPress: () => {
                // Clear form data
                setFormData({
                  username: '',
                  password: '',
                });
                setErrors({});
              }
            }
          ]
        );
        return;
      }

      if (activeRoles.length === 1) {
        // Only one role, login directly
        const singleRole = activeRoles[0] as UserRole;
        await login({
          username: formData.username.trim(),
          password: formData.password,
          role: singleRole,
          deviceType: 'MOBILE',
        });
        
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
      colors={COLORS.gradient.ocean as [string, string, ...string[]]}
      locations={[0, 0.7, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              // Đảm bảo content luôn vừa màn hình
              RESPONSIVE.isSmallScreen && { justifyContent: 'space-between', minHeight: '100%' }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            // Chỉ enable scroll khi thực sự cần thiết
            scrollEnabled={!RESPONSIVE.isSmallScreen}
          >
            {/* Header with Logo and Service Info */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FCFF']}
                  style={styles.logoCircle}
                >
                  <Ionicons name="home" size={RESPONSIVE.components.logo.iconSize} color={COLORS.primary} />
                </LinearGradient>
                <Text style={styles.brandName}>{staticData?.brand?.name || 'CleanHome'}</Text>
                <Text style={styles.brandTagline}>{staticData?.brand?.tagline || 'Dịch vụ giúp việc gia đình chuyên nghiệp'}</Text>
              </View>
              
              <View style={styles.welcomeContainer}>
                <Text style={styles.title}>{staticData.title}</Text>
                <Text style={styles.subtitle}>{staticData.subtitle}</Text>
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#FFF8FC', '#FFF4F8']}
                locations={[0, 0.6, 1]}
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
                    colors={['#FFE5E5', '#FFEFEF', '#FFF5F5']}
                    locations={[0, 0.5, 1]}
                    style={styles.errorContainer}
                  >
                    <Ionicons name="alert-circle" size={20} color={COLORS.error} />
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
              <LinearGradient
                colors={COLORS.gradient.primary as [string, string, string]}
                style={styles.registerButtonGradient}
              >
                <View style={styles.registerButtonInner}>
                  <Button
                    title={staticData.messages.register_link}
                    onPress={() => navigation.navigate('Register')}
                    variant="ghost"
                    size="medium"
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Service Features - Ẩn trên màn hình rất nhỏ để tiết kiệm không gian */}
            {!RESPONSIVE.isSmallScreen && (
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={COLORS.gradient.accent as [string, string, string]}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="shield-checkmark" size={RESPONSIVE.components.features.iconInnerSize} color="white" />
                  </LinearGradient>
                  <Text style={styles.featureText}>{staticData?.features?.trusted || 'Tin cậy & An toàn'}</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={COLORS.gradient.secondary as [string, string, string]}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="time" size={RESPONSIVE.components.features.iconInnerSize} color="white" />
                  </LinearGradient>
                  <Text style={styles.featureText}>{staticData?.features?.on_time || 'Đúng giờ'}</Text>
                </View>
                <View style={styles.featureItem}>
                  <LinearGradient
                    colors={COLORS.gradient.success as [string, string, string]}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="star" size={RESPONSIVE.components.features.iconInnerSize} color="white" />
                  </LinearGradient>
                  <Text style={styles.featureText}>{staticData?.features?.quality || 'Chất lượng cao'}</Text>
                </View>
              </View>
            )}
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
    padding: RESPONSIVE.spacing.lg, // Adaptive padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: RESPONSIVE.spacing.xl, // Adaptive margin
    marginTop: RESPONSIVE.spacing.md, // Adaptive margin
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: RESPONSIVE.spacing.lg, // Adaptive margin
  },
  logoCircle: {
    width: RESPONSIVE.components.logo.size, // Adaptive size
    height: RESPONSIVE.components.logo.size, // Adaptive size
    borderRadius: RESPONSIVE.components.logo.size / 2, // Adaptive radius
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE.spacing.md, // Adaptive margin
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  brandName: {
    ...vietnameseTextStyles.heading2,
    color: COLORS.accent,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  brandTagline: {
    ...vietnameseTextStyles.caption,
    color: COLORS.text.inverse,
    textAlign: 'center',
    marginBottom: RESPONSIVE.spacing.xs, // Tối thiểu margin
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  title: {
    ...vietnameseTextStyles.heading2,
    color: COLORS.text.inverse,
    marginBottom: RESPONSIVE.spacing.xs, // Tối thiểu margin
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    ...vietnameseTextStyles.body,
    color: COLORS.text.inverse,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    marginBottom: RESPONSIVE.spacing.xl, // Adaptive margin
  },
  formCard: {
    borderRadius: UI.BORDER_RADIUS.large,
    padding: RESPONSIVE.components.form.padding, // Adaptive padding
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.1)',
  },
  buttonContainer: {
    marginBottom: RESPONSIVE.components.form.spacing, // Adaptive spacing
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: UI.BORDER_RADIUS.medium,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
    elevation: 2,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: RESPONSIVE.spacing.xl, // Adaptive margin
  },
  footerText: {
    ...vietnameseTextStyles.body,
    color: COLORS.text.inverse,
    marginBottom: RESPONSIVE.spacing.md, // Adaptive margin
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  registerButtonGradient: {
    borderRadius: UI.BORDER_RADIUS.medium,
    padding: 2, // This creates the border effect
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: UI.BORDER_RADIUS.medium - 2,
    overflow: 'hidden',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RESPONSIVE.spacing.lg, // Adaptive margin
    paddingHorizontal: RESPONSIVE.spacing.lg, // Adaptive padding
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconContainer: {
    width: RESPONSIVE.components.features.iconSize, // Adaptive size
    height: RESPONSIVE.components.features.iconSize, // Adaptive size
    borderRadius: RESPONSIVE.components.features.iconSize / 2, // Adaptive radius
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    marginBottom: RESPONSIVE.spacing.sm, // Adaptive margin
  },
  featureText: {
    ...vietnameseTextStyles.caption,
    color: COLORS.text.inverse,
    marginTop: RESPONSIVE.spacing.xs, // Tối thiểu margin
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
