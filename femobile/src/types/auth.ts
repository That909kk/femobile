// Enums for better type safety
export type UserRole = 'CUSTOMER' | 'EMPLOYEE';
export type DeviceType = 'WEB' | 'MOBILE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type RoleStatus = 'ACTIVE' | 'INACTIVE';

// Get Role related interfaces
export interface GetRoleRequest {
  username: string;
  password: string;
}

export interface GetRoleResponse {
  success: boolean;
  message: string;
  data: Record<UserRole, RoleStatus>;
  roleNumbers: number;
}

// Login related interfaces
export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
  deviceType: DeviceType;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expireIn: number;
    role: UserRole;
    deviceType: DeviceType;
    data: CustomerData | EmployeeData;
  };
}

// Register related interfaces
export interface AddressData {
  fullAddress: string;
  ward: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  // Address data - giống web
  address?: AddressData;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    username: string;
    email: string;
    role: UserRole;
  };
}

// User data interfaces for different roles
export interface CustomerData {
  customerId: string;
  accountId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: UserStatus;
  address: string;
  rating?: 'HIGH' | 'MEDIUM' | 'LOW';
  vipLevel?: number;
  birthdate?: string;
  isEmailVerified?: boolean; // Trạng thái xác thực email
}

export interface EmployeeData {
  employeeId: string;
  accountId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: UserStatus;
  address: string;
  rating?: 'HIGH' | 'MEDIUM' | 'LOW';
  hireDate?: string;
  birthdate?: string;
  skills?: string[];
  bio?: string;
  employeeStatus?: string;
}

// Password related interfaces
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

// Token related interfaces
export interface ValidateTokenResponse {
  success: boolean;
  message: string;
  valid: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expireIn: number;
    deviceType: DeviceType;
  };
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data: CustomerData | EmployeeData;
}

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  status?: number;
}

// Auth store interface
export interface AuthState {
  isAuthenticated: boolean;
  user: CustomerData | EmployeeData | null;
  role: UserRole | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  VerifyOTP: { 
    email: string; 
    type: 'register' | 'forgot-password';
    fromLogin?: boolean; // Đánh dấu nếu redirect từ login do email chưa verify
  };
  RoleSelection: {
    username: string;
    password: string;
    availableRoles: Record<UserRole, RoleStatus>;
  };
  Dashboard: undefined;
  CustomerHome: undefined;
  EmployeeDashboard: undefined;
  MainTabs: undefined;
  OrderDetail: { bookingId: string };
  RecurringBookings: undefined;
  RecurringBookingDetail: { recurringBookingId: string };
  NotificationList: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  OrderDetail: { bookingId: string };
  RecurringBookings: undefined;
  RecurringBookingDetail: { recurringBookingId: string };
  VoiceBooking: undefined;
  NotificationList: undefined;
  EmployeeNotifications: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  ChatScreen: { conversationId: string; recipientName: string };
  AddressManagement: undefined;
  // Employee screens
  WorkingHours: undefined;
  AssignmentDetail: { assignmentId: string; assignment?: any };
  EmployeeBookingPosts: undefined;
};
