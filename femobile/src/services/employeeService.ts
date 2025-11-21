import { httpClient } from './httpClient';

export type EmployeeStatus = 'AVAILABLE' | 'BUSY' | 'OFF' | 'INACTIVE';
export type EmployeeRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WorkingZone {
  ward: string;
  city: string;
}

export interface Employee {
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  isMale?: boolean;
  birthdate?: string;
  hiredDate?: string;
  skills?: string[];
  bio?: string;
  rating?: EmployeeRating;
  employeeStatus?: EmployeeStatus;
  completedJobs?: number;
  workingZones?: WorkingZone[];
  account?: {
    accountId: string;
    phoneNumber: string;
    status: string;
    isPhoneVerified: boolean;
    lastLogin: string;
    roles: string[];
  };
}

export interface UpdateEmployeeRequest {
  avatar?: string;
  fullName?: string;
  isMale?: boolean;
  email?: string;
  birthdate?: string;
  hiredDate?: string;
  skills?: string[];
  bio?: string;
  rating?: EmployeeRating;
  employeeStatus?: EmployeeStatus;
}

class EmployeeService {
  private readonly BASE_PATH = '/employee';

  /**
   * Get employee by ID
   */
  async getEmployeeById(employeeId: string): Promise<Employee> {
    const response = await httpClient.get<Employee>(`${this.BASE_PATH}/${employeeId}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong tim thay nhan vien');
    }

    return response.data;
  }

  /**
   * Update employee information
   */
  async updateEmployee(
    employeeId: string,
    updates: UpdateEmployeeRequest,
  ): Promise<Employee> {
    const response = await httpClient.put<Employee>(
      `${this.BASE_PATH}/${employeeId}`,
      updates,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the cap nhat thong tin nhan vien');
    }

    return response.data;
  }

  /**
   * Upload employee avatar
   */
  async uploadAvatar(employeeId: string, imageFile: File | Blob): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', imageFile as any);

    const response = await httpClient.post<{ avatarUrl: string }>(
      `${this.BASE_PATH}/${employeeId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the upload anh dai dien');
    }

    return response.data;
  }

  /**
   * Deactivate employee account
   */
  async deactivateEmployee(employeeId: string): Promise<boolean> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/${employeeId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the vo hieu hoa tai khoan nhan vien');
    }

    return response.data?.success ?? response.success;
  }
}

export const employeeService = new EmployeeService();
