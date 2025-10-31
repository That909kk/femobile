import { httpClient } from './httpClient';
import type { ApiResponse } from '../types/auth';

// Schedule status types
export type ScheduleStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type TimeSlotType = 'UNAVAILABLE' | 'ASSIGNMENT';
export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkingZone {
  ward: string;
  city: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  type: TimeSlotType;
  reason: string | null;
  bookingCode: string | null;
  serviceName: string | null;
  customerName: string | null;
  address: string | null;
  status: AssignmentStatus | null;
  durationHours: number;
}

export interface EmployeeScheduleData {
  employeeId: string;
  fullName: string;
  avatar: string;
  skills: string[];
  rating: string;
  employeeStatus: string;
  workingZones: WorkingZone[];
  timeSlots: TimeSlot[];
}

export interface EmployeeScheduleResponse {
  success: boolean;
  message: string;
  data: EmployeeScheduleData;
}

// Legacy interface for backward compatibility
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
  private readonly BASE_PATH = '/employee-schedule';

  /**
   * Get employee schedule by employeeId and date range
   * API: GET /api/v1/employee-schedule/{employeeId}?startDate=...&endDate=...
   */
  async getEmployeeSchedule(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeScheduleData | null> {
    try {
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      const response = await httpClient.get<EmployeeScheduleData>(
        `${this.BASE_PATH}/${employeeId}?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      if (!response.success || !response.data) {
        console.error('Error loading employee schedule:', response.message);
        return null;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error loading employee schedule:', error);
      return null;
    }
  }

  /**
   * Get schedule for a specific date
   */
  async getScheduleByDate(employeeId: string, date: Date): Promise<TimeSlot[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const scheduleData = await this.getEmployeeSchedule(employeeId, startOfDay, endOfDay);
      
      return scheduleData?.timeSlots || [];
    } catch (error) {
      console.error('Error loading schedule by date:', error);
      return [];
    }
  }

  /**
   * Get weekly schedule
   */
  async getWeeklySchedule(employeeId: string, startDate: Date): Promise<EmployeeScheduleData | null> {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      
      return await this.getEmployeeSchedule(employeeId, startDate, endDate);
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
      return null;
    }
  }

  /**
   * Get today's schedule
   */
  async getTodaySchedule(employeeId: string): Promise<TimeSlot[]> {
    try {
      const today = new Date();
      return await this.getScheduleByDate(employeeId, today);
    } catch (error) {
      console.error('Error loading today schedule:', error);
      return [];
    }
  }

  /**
   * Get schedule statistics - calculated from timeSlots
   */
  async getScheduleStats(employeeId: string): Promise<ScheduleStats | null> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const scheduleData = await this.getEmployeeSchedule(employeeId, startOfDay, endOfDay);
      
      if (!scheduleData) {
        return {
          totalJobs: 0,
          completedJobs: 0,
          inProgressJobs: 0,
          todayRevenue: 0
        };
      }

      const assignments = scheduleData.timeSlots.filter(slot => slot.type === 'ASSIGNMENT');
      
      return {
        totalJobs: assignments.length,
        completedJobs: assignments.filter(a => a.status === 'COMPLETED').length,
        inProgressJobs: assignments.filter(a => a.status === 'IN_PROGRESS').length,
        todayRevenue: 0 // API không trả về revenue, cần tính từ assignments
      };
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