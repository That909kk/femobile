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
import { Button, Input, LanguageSwitcher } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { authService } from '../../services/authService';
import { COLORS, UI, VALIDATION } from '../../constants';
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
      const activeRoles = Object.entries(rolesData)
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
      colors={COLORS.gradient.service as [string, string]}
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
            {/* Header with Logo and Service Info */}
            <View style={styles.headerContainer}>
              {/* Language Switcher */}
              <View style={styles.languageSwitcherContainer}>
                <LanguageSwitcher size="small" variant="minimal" />
              </View>
              
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="home" size={40} color={COLORS.primary} />
                </View>
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
              <View style={styles.formCard}>


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
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
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
              </View>
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
                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
                <Text style={styles.featureText}>{staticData?.features?.trusted || 'Tin cậy & An toàn'}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="time" size={24} color={COLORS.primary} />
                <Text style={styles.featureText}>{staticData?.features?.on_time || 'Đúng giờ'}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="star" size={24} color={COLORS.primary} />
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
    padding: UI.SCREEN_PADDING,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
    position: 'relative',
  },
  languageSwitcherContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.large,
    padding: 24,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: UI.BORDER_RADIUS.medium,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
