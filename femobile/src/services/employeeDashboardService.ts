import { httpClient } from './httpClient';

// Employee dashboard data interfaces
export interface EmployeeDashboardStats {
  todayAppointments: number;
  completedJobs: number;
  pendingJobs: number;
  todayRevenue: number;
  totalRevenue: number;
  rating: number;
  totalRatings: number;
  nextAppointment?: string;
  thisWeekJobs: number;
  thisMonthJobs: number;
}

export interface NextAppointment {
  scheduleId: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  address: string;
}

export interface RecentActivity {
  id: string;
  type: 'job_completed' | 'new_booking' | 'rating_received' | 'payment_received';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  rating?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class EmployeeDashboardService {
  /**
   * Get employee dashboard statistics
   */
  async getDashboardStats(): Promise<EmployeeDashboardStats> {
    try {
      const response = await httpClient.get<ApiResponse<EmployeeDashboardStats>>('/employee/dashboard/stats');
      return response.data?.data || {
        todayAppointments: 0,
        completedJobs: 0,
        pendingJobs: 0,
        todayRevenue: 0,
        totalRevenue: 0,
        rating: 0,
        totalRatings: 0,
        thisWeekJobs: 0,
        thisMonthJobs: 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Không thể tải thống kê dashboard');
    }
  }

  /**
   * Get next appointment details
   */
  async getNextAppointment(): Promise<NextAppointment | null> {
    try {
      const response = await httpClient.get<ApiResponse<NextAppointment>>('/employee/dashboard/next-appointment');
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching next appointment:', error);
      // Return null instead of throwing, as this is optional data
      return null;
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await httpClient.get<ApiResponse<RecentActivity[]>>(`/employee/dashboard/activities?limit=${limit}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('Không thể tải hoạt động gần đây');
    }
  }

  /**
   * Get employee performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    completionRate: number;
    averageRating: number;
    onTimeRate: number;
    customerRetentionRate: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<any>>('/employee/dashboard/performance');
      return response.data?.data || {
        completionRate: 0,
        averageRating: 0,
        onTimeRate: 0,
        customerRetentionRate: 0,
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Không thể tải chỉ số hiệu suất');
    }
  }

  /**
   * Get revenue breakdown
   */
  async getRevenueBreakdown(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<any>>('/employee/dashboard/revenue');
      return response.data?.data || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
      };
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      throw new Error('Không thể tải thống kê doanh thu');
    }
  }
}

export const employeeDashboardService = new EmployeeDashboardService();