import { httpClient } from './httpClient';
import type { ApiResponse } from '../types/auth';

// Schedule status types
export type ScheduleStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

// Employee schedule interfaces
export interface EmployeeSchedule {
  scheduleId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: number;
  serviceName: string;
  startTime: string;
  endTime: string;
  date: string;
  address: string;
  status: ScheduleStatus;
  price: number;
  notes?: string;
  isUrgent: boolean;
  completionPercent?: number;
  rating?: number;
  completedAt?: string;
}

export interface ScheduleStats {
  totalJobs: number;
  completedJobs: number;
  inProgressJobs: number;
  todayRevenue: number;
}

class EmployeeScheduleService {
  /**
   * Get schedule for a specific date
   */
  async getScheduleByDate(date: Date): Promise<EmployeeSchedule[]> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await httpClient.get<ApiResponse<EmployeeSchedule[]>>(`/employee/schedule?date=${dateStr}`);
      
      if (!response.success) {
        console.error('Error loading schedule:', response.message);
        return [];
      }
      
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading schedule:', error);
      return [];
    }
  }

  /**
   * Get weekly schedule
   */
  async getWeeklySchedule(startDate: Date): Promise<EmployeeSchedule[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await httpClient.get<ApiResponse<EmployeeSchedule[]>>(
        `/employee/schedule?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      if (!response.success) {
        console.error('Error loading weekly schedule:', response.message);
        return [];
      }
      
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
      return [];
    }
  }

  /**
   * Get today's schedule
   */
  async getTodaySchedule(): Promise<EmployeeSchedule[]> {
    try {
      const today = new Date();
      return await this.getScheduleByDate(today);
    } catch (error) {
      console.error('Error loading today schedule:', error);
      return [];
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(): Promise<ScheduleStats | null> {
    try {
      const response = await httpClient.get<ApiResponse<ScheduleStats>>('/employee/schedule/stats');
      
      if (!response.success) {
        console.error('Error fetching schedule stats:', response.message);
        return null;
      }
      
      if (!response.data?.data) {
        console.error('Invalid schedule stats data');
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching schedule stats:', error);
      return null;
    }
  }

  /**
   * Update schedule status
   */
  async updateScheduleStatus(scheduleId: string, status: ScheduleStatus, notes?: string): Promise<boolean> {
    try {
      const response = await httpClient.put<ApiResponse<any>>(`/employee/schedule/${scheduleId}/status`, {
        status,
        notes
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Không thể cập nhật trạng thái lịch làm việc');
      }
      
      return response.data?.success || response.success;
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw new Error('Không thể cập nhật trạng thái lịch làm việc');
    }
  }

  /**
   * Start work on a scheduled job
   */
  async startWork(scheduleId: string): Promise<boolean> {
    try {
      return await this.updateScheduleStatus(scheduleId, 'in-progress');
    } catch (error) {
      console.error('Error starting work:', error);
      throw new Error('Không thể bắt đầu công việc');
    }
  }

  /**
   * Complete a job
   */
  async completeWork(scheduleId: string, notes?: string): Promise<boolean> {
    try {
      return await this.updateScheduleStatus(scheduleId, 'completed', notes);
    } catch (error) {
      console.error('Error completing work:', error);
      throw new Error('Không thể hoàn thành công việc');
    }
  }

  /**
   * Cancel a scheduled job
   */
  async cancelWork(scheduleId: string, reason?: string): Promise<boolean> {
    try {
      return await this.updateScheduleStatus(scheduleId, 'cancelled', reason);
    } catch (error) {
      console.error('Error cancelling work:', error);
      throw new Error('Không thể hủy công việc');
    }
  }

  /**
   * Get available employees for customer app
   */
  async getAvailableEmployees(params?: {
    status?: string;
    limit?: number;
    city?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      // Build URL manually to avoid encoding Vietnamese city names
      const queryParts: string[] = [];
      if (params?.status) queryParts.push(`status=${params.status}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.city) queryParts.push(`city=${params.city}`);

      const url = `/employee-schedule${queryParts.length > 0 ? '?' + queryParts.join('&') : ''}`;
      
      const response = await httpClient.get<any[]>(url);
      return response;
    } catch (error) {
      console.error('Error getting available employees:', error);
      throw new Error('Không thể tải danh sách nhân viên');
    }
  }
}

export const employeeScheduleService = new EmployeeScheduleService();