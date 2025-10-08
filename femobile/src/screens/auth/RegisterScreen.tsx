import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Select, Checkbox, TermsModal } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useStaticData } from '../../hooks/useStaticData';
import { COLORS, UI, VALIDATION } from '../../constants';
import type { RootStackParamList, UserRole } from '../../types/auth';

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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Refs for input fields
  const fullNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  
  const { register, loading, error } = useAuth();
  const { data: staticData } = useStaticData('register');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.role) {
      newErrors.role = staticData?.messages?.validation?.role_required || 'Role is required';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = staticData?.messages?.validation?.fullName_required || 'Full name is required';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = staticData?.messages?.validation?.fullName_invalid || 'Full name should only contain letters and spaces';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = staticData?.messages?.validation?.username_required || 'Username is required';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = staticData?.messages?.validation?.username_length || 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = staticData?.messages?.validation?.username_invalid || 'Username can only contain letters, numbers and underscores';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = staticData?.messages?.validation?.email_required || 'Email is required';
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = staticData?.messages?.validation?.email_invalid || 'Invalid email format';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = staticData?.messages?.validation?.phoneNumber_required || 'Phone number is required';
    } else if (!VALIDATION.PHONE_REGEX.test(formData.phoneNumber)) {
      newErrors.phoneNumber = staticData?.messages?.validation?.phoneNumber_invalid || 'Invalid phone number';
    }
    
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
    
    if (!acceptTerms) {
      newErrors.terms = staticData?.messages?.validation?.terms_required || 'You must agree to the terms of service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        role: formData.role as UserRole,
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
      });
      
      Alert.alert(
        staticData?.messages?.alert_success || 'Thành công',
        staticData?.messages?.register_success || 'Registration successful!',
        [
          {
            text: staticData?.messages?.alert_ok || 'OK',
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
        err.message || staticData?.messages?.register_error || 'Registration failed',
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

  const roleOptions = staticData?.form?.role?.options ? [
    { label: staticData.form.role.options.customer, value: 'CUSTOMER' },
    { label: staticData.form.role.options.employee, value: 'EMPLOYEE' },
    { label: staticData.form.role.options.admin, value: 'ADMIN' },
  ] : [
    { label: staticData?.form?.role?.options?.customer || 'Customer', value: 'CUSTOMER' },
    { label: staticData?.form?.role?.options?.employee || 'Employee', value: 'EMPLOYEE' },
    { label: staticData?.form?.role?.options?.admin || 'Admin', value: 'ADMIN' },
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
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{staticData.title}</Text>
            <Text style={styles.subtitle}>{staticData.subtitle}</Text>
          </View>

          <View style={styles.formContainer}>
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
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

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
    backgroundColor: COLORS.background,
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
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    marginTop: 2,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  termsText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  termsLinkText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontSize: 14,
    lineHeight: 20,
  },
});
