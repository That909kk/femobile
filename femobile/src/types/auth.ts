// Enums for better type safety
export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
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
    data: CustomerData | EmployeeData | AdminData;
  };
}

// Register related interfaces
export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
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
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: UserStatus;
  address: string;
}

export interface EmployeeData {
  employeeId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: UserStatus;
  address: string;
}

export interface AdminData {
  adminId: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  address: string;
  department: string;
  contactInfo: string;
  hireDate: string;
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
  data: CustomerData | EmployeeData | AdminData;
}

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// Auth store interface
export interface AuthState {
  isAuthenticated: boolean;
  user: CustomerData | EmployeeData | AdminData | null;
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
  VerifyOTP: { email: string; type: 'register' | 'forgot-password' };
  ChangePassword: undefined;
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
  NotificationList: undefined;
};
