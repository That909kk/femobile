import { httpClient } from './httpClient';

export interface Account {
  accountId: string;
  username: string;
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

export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  avatar: string;
  birthdate: string;
  rating: number | null;
  username: string;
  accountStatus: string;
  isPhoneVerified: boolean;
  lastLogin: string;
  createdAt: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
  // Optional role-specific fields
  vipLevel?: string | null;
  hiredDate?: string;
  skills?: string[];
  bio?: string;
  employeeStatus?: string;
}

class UserInfoService {
  async getCustomerInfo(customerId: string): Promise<UserInfo> {
    const response = await httpClient.get<CustomerData>(`/customer/${customerId}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai thong tin khach hang');
    }

    return this.mapCustomerToUserInfo(response.data);
  }

  async getEmployeeInfo(employeeId: string): Promise<UserInfo> {
    const response = await httpClient.get<EmployeeData>(`/employee/${employeeId}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai thong tin nhan vien');
    }

    return this.mapEmployeeToUserInfo(response.data);
  }

  async getUserInfo(role: 'CUSTOMER' | 'EMPLOYEE', userId: string): Promise<UserInfo> {
    if (role === 'CUSTOMER') {
      return this.getCustomerInfo(userId);
    }

    if (role === 'EMPLOYEE') {
      return this.getEmployeeInfo(userId);
    }

    throw new Error('Vai tro khong hop le');
  }

  private mapCustomerToUserInfo(customer: CustomerData): UserInfo {
    return {
      id: customer.customerId,
      fullName: customer.fullName,
      email: customer.email,
      phoneNumber: customer.account.phoneNumber,
      isMale: customer.isMale,
      avatar: customer.avatar,
      birthdate: customer.birthdate,
      vipLevel: customer.vipLevel,
      rating: customer.rating,
      username: customer.account.username,
      accountStatus: customer.account.status,
      isPhoneVerified: customer.account.isPhoneVerified,
      lastLogin: customer.account.lastLogin,
      createdAt: customer.createdAt,
      roles: customer.account.roles,
    };
  }

  private mapEmployeeToUserInfo(employee: EmployeeData): UserInfo {
    return {
      id: employee.employeeId,
      fullName: employee.fullName,
      email: employee.email,
      phoneNumber: employee.account.phoneNumber,
      isMale: employee.isMale,
      avatar: employee.avatar,
      birthdate: employee.birthdate,
      hiredDate: employee.hiredDate,
      skills: employee.skills,
      bio: employee.bio,
      employeeStatus: employee.employeeStatus,
      rating: employee.rating,
      username: employee.account.username,
      accountStatus: employee.account.status,
      isPhoneVerified: employee.account.isPhoneVerified,
      lastLogin: employee.account.lastLogin,
      createdAt: employee.createdAt,
      roles: employee.account.roles,
    };
  }
}

export const userInfoService = new UserInfoService();
