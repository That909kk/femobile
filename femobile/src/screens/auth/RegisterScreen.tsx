import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Select, Checkbox, TermsModal } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { COLORS, UI, VALIDATION } from '../../constants';
import { colors, typography, spacing, borderRadius, shadows, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';
import type { RootStackParamList, UserRole } from '../../types/auth';
import addressService, { Province, Commune } from '../../services/addressService';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    role: '' as UserRole | '',
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    // Address fields - giống web
    provinceCode: '',
    communeCode: '',
    streetAddress: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Address data state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  
  // Refs for input fields
  const fullNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const streetAddressRef = useRef<TextInput>(null);
  
  const { register, loading, error } = useAuth();
  const { data: staticData } = useStaticData('register');
  
  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await addressService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Failed to load provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);
  
  // Load communes when province changes
  useEffect(() => {
    if (formData.provinceCode) {
      const loadCommunes = async () => {
        setLoadingCommunes(true);
        setCommunes([]);
        setFormData(prev => ({ ...prev, communeCode: '' }));
        try {
          const data = await addressService.getCommunesByProvince(formData.provinceCode);
          setCommunes(data);
        } catch (error) {
          console.error('Failed to load communes:', error);
        } finally {
          setLoadingCommunes(false);
        }
      };
      loadCommunes();
    } else {
      setCommunes([]);
    }
  }, [formData.provinceCode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.role) {
      newErrors.role = staticData?.messages?.validation?.role_required || 'Vui lòng chọn vai trò';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = staticData?.messages?.validation?.fullName_required || 'Vui lòng nhập họ và tên';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = staticData?.messages?.validation?.fullName_invalid || 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = staticData?.messages?.validation?.username_required || 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = staticData?.messages?.validation?.username_length || 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = staticData?.messages?.validation?.username_invalid || 'Tên đăng nhập chỉ được chứa chữ cái, số và gạch dưới';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = staticData?.messages?.validation?.email_required || 'Vui lòng nhập email';
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = staticData?.messages?.validation?.email_invalid || 'Định dạng email không hợp lệ';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = staticData?.messages?.validation?.phoneNumber_required || 'Vui lòng nhập số điện thoại';
    } else if (!VALIDATION.PHONE_REGEX.test(formData.phoneNumber)) {
      newErrors.phoneNumber = staticData?.messages?.validation?.phoneNumber_invalid || 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = staticData?.messages?.validation?.password_required || 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = staticData?.messages?.validation?.password_length || 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = staticData?.messages?.validation?.confirm_password_required || 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = staticData?.messages?.validation?.passwords_not_match || 'Mật khẩu không khớp';
    }
    
    // Address validation - giống web
    if (!formData.provinceCode) {
      newErrors.provinceCode = 'Vui lòng chọn Tỉnh/Thành phố';
    }
    
    if (!formData.communeCode) {
      newErrors.communeCode = 'Vui lòng chọn Phường/Xã';
    }
    
    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = 'Vui lòng nhập số nhà, tên đường';
    } else if (formData.streetAddress.length > 200) {
      newErrors.streetAddress = 'Địa chỉ không được vượt quá 200 ký tự';
    }
    
    if (!acceptTerms) {
      newErrors.terms = staticData?.messages?.validation?.terms_required || 'Bạn phải đồng ý với điều khoản dịch vụ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Lấy thông tin địa chỉ - giống web
      const selectedProvince = provinces.find(p => p.code === formData.provinceCode);
      const selectedCommune = communes.find(c => c.code === formData.communeCode);
      
      // Format full address
      const fullAddress = [
        formData.streetAddress.trim(),
        selectedCommune?.name || '',
        selectedProvince?.name || ''
      ].filter(Boolean).join(', ');
      
      await register({
        role: formData.role as UserRole,
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        // Gửi address data - giống web
        address: {
          fullAddress: fullAddress,
          ward: selectedCommune?.name || '',
          city: selectedProvince?.name || '',
          latitude: null,
          longitude: null
        }
      });
      
      // Thành công - navigate to VerifyOTP (giống web navigate to /verify-email)
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.register_success || 'Đăng ký thành công! Vui lòng xác thực email để hoàn tất.',
        [
          {
            text: staticData?.messages?.alert_ok || 'Đồng ý',
            onPress: () => navigation.navigate('VerifyOTP', {
              email: formData.email,
              type: 'register',
            }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        staticData?.messages?.alert_error || 'Lỗi',
        err.message || staticData?.messages?.register_error || 'Đăng ký thất bại',
        [{ text: staticData?.messages?.alert_ok || 'Đồng ý' }]
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const roleOptions = staticData?.form?.role?.options ? [
    { label: staticData.form.role.options.customer, value: 'CUSTOMER' },
    { label: staticData.form.role.options.employee, value: 'EMPLOYEE' },
    // Admin role is not allowed for registration
  ] : [
    { label: staticData?.form?.role?.options?.customer || 'Khách hàng', value: 'CUSTOMER' },
    { label: staticData?.form?.role?.options?.employee || 'Nhân viên', value: 'EMPLOYEE' },
    // Admin role is not allowed for registration
  ];

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
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={responsive.moderateScale(36)} color={colors.highlight.teal} />
              </View>
            </View>
            <Text style={styles.title}>{staticData.title}</Text>
            <Text style={styles.subtitle}>{staticData.subtitle}</Text>
          </View>

          <View style={styles.formCard}>
            <Select
              label={staticData.form.role.label}
              value={formData.role}
              options={roleOptions}
              onSelect={(value) => handleInputChange('role', value)}
              error={errors.role}
              placeholder={staticData.form.role.placeholder}
            />

            <Input
              ref={fullNameRef}
              label={staticData.form.fullName.label}
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder={staticData.form.fullName.placeholder}
              error={errors.fullName}
              leftIcon="person"
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Input
              ref={usernameRef}
              label={staticData.form.username.label}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder={staticData.form.username.placeholder}
              autoCapitalize="none"
              error={errors.username}
              leftIcon="at"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Input
              ref={emailRef}
              label={staticData.form.email.label}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder={staticData.form.email.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon="mail"
              returnKeyType="next"
              onSubmitEditing={() => phoneNumberRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Input
              ref={phoneNumberRef}
              label={staticData.form.phoneNumber.label}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder={staticData.form.phoneNumber.placeholder}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              leftIcon="call"
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
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Input
              ref={confirmPasswordRef}
              label={staticData.form.confirm_password.label}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder={staticData.form.confirm_password.placeholder}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon="lock-closed"
              returnKeyType="next"
              onSubmitEditing={() => streetAddressRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Address Section - giống web */}
            <View style={styles.addressSection}>
              <View style={styles.addressHeader}>
                <Ionicons name="location" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
                <Text style={styles.addressTitle}>Địa chỉ</Text>
              </View>
              
              {/* Province Select */}
              <Select
                label="Tỉnh/Thành phố"
                value={formData.provinceCode}
                options={provinces.map(p => ({ label: p.name, value: p.code }))}
                onSelect={(value) => handleInputChange('provinceCode', value)}
                error={errors.provinceCode}
                placeholder={loadingProvinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}
                disabled={loadingProvinces}
              />
              
              {/* Commune Select */}
              <Select
                label="Phường/Xã"
                value={formData.communeCode}
                options={communes.map(c => ({ label: c.name, value: c.code }))}
                onSelect={(value) => handleInputChange('communeCode', value)}
                error={errors.communeCode}
                placeholder={
                  !formData.provinceCode 
                    ? 'Vui lòng chọn Tỉnh/Thành phố trước' 
                    : loadingCommunes 
                      ? 'Đang tải...' 
                      : 'Chọn Phường/Xã'
                }
                disabled={!formData.provinceCode || loadingCommunes}
              />
              
              {/* Street Address Input */}
              <Input
                ref={streetAddressRef}
                label="Số nhà, tên đường"
                value={formData.streetAddress}
                onChangeText={(value) => handleInputChange('streetAddress', value)}
                placeholder="VD: 123 Nguyễn Văn A"
                error={errors.streetAddress}
                leftIcon="home"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            {/* Terms and Conditions Checkbox */}
            <View style={styles.termsContainer}>
              <Checkbox
                checked={acceptTerms}
                onPress={() => setAcceptTerms(!acceptTerms)}
                style={styles.checkbox}
              />
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  {staticData.actions.agree_terms}{' '}
                  <Text 
                    style={styles.termsLinkText}
                    onPress={() => setShowTermsModal(true)}
                  >
                    {staticData.actions.terms_link}
                  </Text>
                </Text>
              </View>
            </View>
            
            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={responsive.moderateScale(20)} color={colors.feedback.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title={loading ? staticData.actions.registering : staticData.actions.register}
              onPress={handleRegister}
              loading={loading}
              disabled={loading || !acceptTerms}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {staticData.messages.have_account}{' '}
            </Text>
            <Button
              title={staticData.messages.login_link}
              onPress={() => navigation.navigate('Login')}
              variant="outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Terms and Conditions Modal */}
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={() => setAcceptTerms(true)}
      />
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
    marginBottom: responsiveSpacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
  },
  logoCircle: {
    width: responsive.moderateScale(72),
    height: responsive.moderateScale(72),
    borderRadius: responsive.moderateScale(36),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  title: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  subtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  
  // Form Styles
  formCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(borderRadius.card),
    padding: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.lg,
    ...shadows.card,
  },
  
  // Address Section Styles
  addressSection: {
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
    paddingTop: responsiveSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
  },
  addressTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginLeft: responsiveSpacing.sm,
  },
  
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.xs,
  },
  checkbox: {
    marginTop: responsive.moderateScale(2),
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: responsiveSpacing.sm,
  },
  termsText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    lineHeight: responsive.moderateScale(20),
  },
  termsLinkText: {
    color: colors.highlight.teal,
    textDecorationLine: 'underline',
    fontSize: responsiveFontSize.caption,
    lineHeight: responsive.moderateScale(20),
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
  
  // Footer Styles
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: responsiveSpacing.lg,
  },
  footerText: {
    color: colors.neutral.textSecondary,
    fontSize: responsiveFontSize.body,
  },
});
