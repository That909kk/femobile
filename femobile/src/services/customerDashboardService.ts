import { httpClient } from './httpClient';

// Customer dashboard data interfaces
export interface CustomerDashboardStats {
  upcomingAppointments: number;
  completedJobs: number;
  totalSpent: number;
  membershipLevel: string;
  loyaltyPoints: number;
  thisMonthBookings: number;
  favoriteServices: string[];
  averageRating: number;
}

export interface UpcomingBooking {
  bookingId: string;
  serviceName: string;
  employeeName: string;
  appointmentDate: string;
  appointmentTime: string;
  address: string;
  status: string;
}

export interface RecentBooking {
  bookingId: string;
  serviceName: string;
  employeeName: string;
  completedDate: string;
  rating?: number;
  feedback?: string;
  amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class CustomerDashboardService {
  /**
   * Get customer dashboard statistics
   */
  async getDashboardStats(): Promise<CustomerDashboardStats> {
    try {
      const response = await httpClient.get<ApiResponse<CustomerDashboardStats>>('/customer/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer dashboard stats:', error);
      throw new Error('Không thể tải thống kê dashboard');
    }
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(limit: number = 5): Promise<UpcomingBooking[]> {
    try {
      const response = await httpClient.get<ApiResponse<UpcomingBooking[]>>(`/customer/dashboard/upcoming?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      throw new Error('Không thể tải lịch hẹn sắp tới');
    }
  }

  /**
   * Get recent completed bookings
   */
  async getRecentBookings(limit: number = 5): Promise<RecentBooking[]> {
    try {
      const response = await httpClient.get<ApiResponse<RecentBooking[]>>(`/customer/dashboard/recent?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      throw new Error('Không thể tải lịch sử đặt dịch vụ');
    }
  }

  /**
   * Get loyalty points history
   */
  async getLoyaltyPointsHistory(limit: number = 10): Promise<{
    id: string;
    type: 'earned' | 'redeemed';
    points: number;
    description: string;
    date: string;
  }[]> {
    try {
      const response = await httpClient.get<ApiResponse<any[]>>(`/customer/dashboard/loyalty-points?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching loyalty points history:', error);
      throw new Error('Không thể tải lịch sử điểm thưởng');
    }
  }

  /**
   * Get recommended services based on customer history
   */
  async getRecommendedServices(): Promise<{
    serviceId: number;
    serviceName: string;
    description: string;
    price: number;
    rating: number;
    image?: string;
  }[]> {
    try {
      const response = await httpClient.get<ApiResponse<any[]>>('/customer/dashboard/recommended-services');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recommended services:', error);
      return []; // Return empty array instead of throwing for recommendations
    }
  }

  /**
   * Get spending summary
   */
  async getSpendingSummary(): Promise<{
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    mostUsedService: string;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<any>>('/customer/dashboard/spending');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching spending summary:', error);
      throw new Error('Không thể tải thống kê chi tiêu');
    }
  }
}

export const customerDashboardService = new CustomerDashboardService();