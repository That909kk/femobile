import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/auth';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useNavigationAnimation = () => {
  const navigation = useNavigation<NavigationProp>();

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const navigateToVerifyOTP = (params: { email: string; type: 'register' | 'forgot-password' }) => {
    navigation.navigate('VerifyOTP', params);
  };

  const navigateToResetPassword = (params: { email: string }) => {
    navigation.navigate('ResetPassword', params);
  };

  const navigateToPlaceholder = () => {
    navigation.navigate('PlaceholderScreen' as any);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const navigateAndReset = (routeName: keyof RootStackParamList, params?: any) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  };

  return {
    navigateToRegister,
    navigateToLogin,
    navigateToForgotPassword,
    navigateToVerifyOTP,
    navigateToResetPassword,
    navigateToPlaceholder,
    goBack,
    navigateAndReset,
  };
};
