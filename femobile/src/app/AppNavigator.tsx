import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions, TransitionPresets, StackCardInterpolationProps } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import {
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  VerifyOTPScreen,
  ResetPasswordScreen,
  RoleSelectionScreen,
} from '../screens';
import { OrderDetailScreen, NotificationsScreen as CustomerNotificationsScreen } from '../screens/main/customer';
import { NotificationsScreen as EmployeeNotificationsScreen } from '../screens/main/employee';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from '../types/auth';
import { COLORS, ANIMATION_CONFIGS, getBaseScreenOptions } from '../constants';

const Stack = createStackNavigator<RootStackParamList>();

// Define navigation flow hierarchy for better animation direction
const NAVIGATION_HIERARCHY = {
  'Login': 0,
  'Register': 1,
  'ForgotPassword': 1,
  'RoleSelection': 1,
  'VerifyOTP': 2,
  'ResetPassword': 3,
} as const;

// Custom transition based on navigation direction  
const getAuthScreenOptions = (routeName: string): StackNavigationOptions => {
  const baseOptions = getBaseScreenOptions(COLORS.background);

  // For Login - when navigating TO Login (back from Register/ForgotPassword)
  if (routeName === 'Login') {
    return {
      ...baseOptions,
      // When going back to Login, slide from left
      cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-layouts.screen.width, 0],
                }),
              },
            ],
          },
        };
      },
      transitionSpec: {
        open: {
          animation: 'timing' as const,
          config: {
            duration: 300,
          },
        },
        close: {
          animation: 'timing' as const,
          config: {
            duration: 250,
          },
        },
      },
    };
  }

  // For Register and ForgotPassword - slide from right (forward navigation)
  if (routeName === 'Register' || routeName === 'ForgotPassword') {
    return {
      ...baseOptions,
      ...ANIMATION_CONFIGS.slideFromRight,
    };
  }

  // For other screens (VerifyOTP, ResetPassword) - continue sliding from right
  return {
    ...baseOptions,
    ...ANIMATION_CONFIGS.slideFromRight,
  };
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={({ route }) => getAuthScreenOptions(route.name)}
    initialRouteName="Login"
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={getAuthScreenOptions('Login')}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={getAuthScreenOptions('Register')}
    />
    <Stack.Screen 
      name="ForgotPassword" 
      component={ForgotPasswordScreen}
      options={getAuthScreenOptions('ForgotPassword')}
    />
    <Stack.Screen 
      name="VerifyOTP" 
      component={VerifyOTPScreen}
      options={getAuthScreenOptions('VerifyOTP')}
    />
    <Stack.Screen 
      name="ResetPassword" 
      component={ResetPasswordScreen}
      options={getAuthScreenOptions('ResetPassword')}
    />
    <Stack.Screen 
      name="RoleSelection" 
      component={RoleSelectionScreen}
      options={getAuthScreenOptions('RoleSelection')}
    />
  </Stack.Navigator>
);

const MainStack = () => {
  const { role } = useAuth();
  const NotificationScreen = role === 'EMPLOYEE' ? EmployeeNotificationsScreen : CustomerNotificationsScreen;

  return (
    <Stack.Navigator
      screenOptions={{
        ...getBaseScreenOptions(COLORS.background),
        headerShown: false,
      }}
      initialRouteName="MainTabs"
    >
      {/* Main Tab Navigator - handles role-based navigation internally */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          headerShown: false,
          ...ANIMATION_CONFIGS.fade,
        }}
      />
      {/* Order Detail Screen */}
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{
          headerShown: false,
          ...ANIMATION_CONFIGS.slideFromRight,
        }}
      />
      {/* Notifications Screen */}
      <Stack.Screen 
        name="NotificationList" 
        component={NotificationScreen}
        options={{
          headerShown: false,
          ...ANIMATION_CONFIGS.slideFromRight,
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.text.primary }}>Đang kiểm tra...</Text>
      </View>
    );
  }

  // Logic: 
  // - Nếu có accessToken VÀ refreshToken (isAuthenticated = true) -> vào Main
  // - Nếu KHÔNG có hoặc thiếu 1 trong 2 tokens -> đá ra Auth (Login)
  return (
    <Stack.Navigator 
      screenOptions={{ 
        ...getBaseScreenOptions(COLORS.background),
        ...ANIMATION_CONFIGS.fade,
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen 
          name="Main" 
          component={MainStack}
          options={{
            ...getBaseScreenOptions(COLORS.background),
            ...ANIMATION_CONFIGS.fade,
          }}
        />
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthStack}
          options={{
            ...getBaseScreenOptions(COLORS.background),
            ...ANIMATION_CONFIGS.fade,
          }}
        />
      )}
    </Stack.Navigator>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PaperProvider>
      <LanguageProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </LanguageProvider>
    </PaperProvider>
  );
};

export default AppNavigator;
