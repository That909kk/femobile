import { httpClient } from './httpClient';

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class EmployeeScheduleService {
  /**
   * Get schedule for a specific date
   */
  async getScheduleByDate(date: Date): Promise<EmployeeSchedule[]> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await httpClient.get<ApiResponse<EmployeeSchedule[]>>(`/employee/schedule?date=${dateStr}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw new Error('Không thể tải lịch làm việc');
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
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      throw new Error('Không thể tải lịch làm việc trong tuần');
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
      console.error('Error fetching today schedule:', error);
      throw new Error('Không thể tải lịch làm việc hôm nay');
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(): Promise<ScheduleStats> {
    try {
      const response = await httpClient.get<ApiResponse<ScheduleStats>>('/employee/schedule/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching schedule stats:', error);
      throw new Error('Không thể tải thống kê lịch làm việc');
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
      return response.data.success;
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
}

export const employeeScheduleService = new EmployeeScheduleService();