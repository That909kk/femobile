import { httpClient } from './httpClient';

// Base response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Account information interface
export interface Account {
  accountId: string;
  username: string;
  password: string;
  phoneNumber: string;
  status: string;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
}

// Customer data interface
export interface CustomerData {
  customerId: string;
  account: Account;
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  rating: number | null;
  vipLevel: string | null;
  createdAt: string;
  updatedAt: string;
}

// Employee data interface  
export interface EmployeeData {
  employeeId: string;
  account: Account;
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: number | null;
  employeeStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Unified user info interface for app usage
export interface UserInfo {
  id: string; // customerId or employeeId
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  avatar: string;
  birthdate: string;
  // Role-specific fields
  hiredDate?: string; // Employee only
  skills?: string[]; // Employee only
  bio?: string; // Employee only
  employeeStatus?: string; // Employee only
  vipLevel?: string | null; // Customer only
  rating: number | null;
  // Account info
  username: string;
  accountStatus: string;
  isPhoneVerified: boolean;
  lastLogin: string;
  createdAt: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
}

class UserInfoService {
  /**
   * Get customer information by customer ID
   */
  async getCustomerInfo(customerId: string): Promise<UserInfo> {
    try {
      console.log('Fetching customer info for ID:', customerId);
      console.log('API Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
      console.log('Full endpoint URL:', `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'}/customer/${customerId}`);
      
      const response = await httpClient.get<ApiResponse<CustomerData>>(`/customer/${customerId}`);
      
      console.log('Full API response:', JSON.stringify(response, null, 2));
      console.log('Response data:', response?.data);
      console.log('Success field:', response?.data?.success);
      console.log('Data field exists:', !!response?.data?.data);
      
      // Try different response structures
      if (response?.data?.success && response.data.data) {
        // Structure: { success: true, data: {...} }
        const customerData = response.data.data;
        console.log('Successfully fetched customer info (structure 1):', {
          name: customerData.fullName,
          email: customerData.email,
          vipLevel: customerData.vipLevel,
          roles: customerData.account.roles
        });
        return this.mapCustomerToUserInfo(customerData);
      } else if (response?.data && (response.data as any).customerId) {
        // Direct data structure - API returns data directly
        const customerData = response.data as any as CustomerData;
        console.log('Successfully fetched customer info (direct structure):', {
          name: customerData.fullName,
          email: customerData.email,
          vipLevel: customerData.vipLevel
        });
        return this.mapCustomerToUserInfo(customerData);
      } else {
        console.warn('API response unsuccessful or no data:', {
          hasResponse: !!response,
          hasData: !!response?.data,
          success: response?.data?.success,
          hasDataField: !!response?.data?.data,
          fullData: response?.data
        });
        throw new Error('API response unsuccessful or no data');
      }
    } catch (error: any) {
      console.error('API call failed:', {
        customerId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        responseData: error.response?.data
      });
      // Throw error to let caller handle it
      throw error;
    }
  }

  /**
   * Get employee information by employee ID
   */
  async getEmployeeInfo(employeeId: string): Promise<UserInfo> {
    try {
      console.log('Fetching employee info for ID:', employeeId);
      console.log('API Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
      console.log('Full endpoint URL:', `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'}/employee/${employeeId}`);
      
      const response = await httpClient.get<ApiResponse<EmployeeData>>(`/employee/${employeeId}`);
      
      console.log('Full API response:', JSON.stringify(response, null, 2));
      console.log('Response data:', response?.data);
      console.log('Success field:', response?.data?.success);
      console.log('Data field exists:', !!response?.data?.data);
      
      // Try different response structures
      if (response?.data?.success && response.data.data) {
        // Structure: { success: true, data: {...} }
        const employeeData = response.data.data;
        console.log('Successfully fetched employee info (structure 1):', {
          name: employeeData.fullName,
          email: employeeData.email,
          skills: employeeData.skills,
          roles: employeeData.account.roles
        });
        return this.mapEmployeeToUserInfo(employeeData);
      } else if (response?.data && (response.data as any).employeeId) {
        // Direct data structure - API returns data directly
        const employeeData = response.data as any as EmployeeData;
        console.log('Successfully fetched employee info (direct structure):', {
          name: employeeData.fullName,
          email: employeeData.email,
          skills: employeeData.skills,
          roles: employeeData.account.roles
        });
        return this.mapEmployeeToUserInfo(employeeData);
      } else {
        console.warn('API response unsuccessful or no data:', {
          hasResponse: !!response,
          hasData: !!response?.data,
          success: response?.data?.success,
          hasDataField: !!response?.data?.data,
          fullData: response?.data
        });
        throw new Error('API response unsuccessful or no data');
      }
    } catch (error: any) {
      console.error('API call failed:', {
        employeeId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        responseData: error.response?.data
      });
      // Throw error to let caller handle it
      throw error;
    }
  }

  /**
   * Get user information based on role and user ID
   */
  async getUserInfo(role: 'CUSTOMER' | 'EMPLOYEE', userId: string): Promise<UserInfo> {
    if (role === 'CUSTOMER') {
      return this.getCustomerInfo(userId);
    } else if (role === 'EMPLOYEE') {
      return this.getEmployeeInfo(userId);
    } else {
      throw new Error('Invalid user role');
    }
  }

  /**
   * Map CustomerData to UserInfo
   */
  private mapCustomerToUserInfo(customerData: CustomerData): UserInfo {
    return {
      id: customerData.customerId,
      fullName: customerData.fullName,
      email: customerData.email,
      phoneNumber: customerData.account.phoneNumber,
      isMale: customerData.isMale,
      avatar: customerData.avatar,
      birthdate: customerData.birthdate,
      vipLevel: customerData.vipLevel,
      rating: customerData.rating,
      username: customerData.account.username,
      accountStatus: customerData.account.status,
      isPhoneVerified: customerData.account.isPhoneVerified,
      lastLogin: customerData.account.lastLogin,
      createdAt: customerData.createdAt,
      roles: customerData.account.roles,
    };
  }

  /**
   * Map EmployeeData to UserInfo
   */
  private mapEmployeeToUserInfo(employeeData: EmployeeData): UserInfo {
    return {
      id: employeeData.employeeId,
      fullName: employeeData.fullName,
      email: employeeData.email,
      phoneNumber: employeeData.account.phoneNumber,
      isMale: employeeData.isMale,
      avatar: employeeData.avatar,
      birthdate: employeeData.birthdate,
      hiredDate: employeeData.hiredDate,
      skills: employeeData.skills,
      bio: employeeData.bio,
      employeeStatus: employeeData.employeeStatus,
      rating: employeeData.rating,
      username: employeeData.account.username,
      accountStatus: employeeData.account.status,
      isPhoneVerified: employeeData.account.isPhoneVerified,
      lastLogin: employeeData.account.lastLogin,
      createdAt: employeeData.createdAt,
      roles: employeeData.account.roles,
    };
  }

}

export const userInfoService = new UserInfoService();