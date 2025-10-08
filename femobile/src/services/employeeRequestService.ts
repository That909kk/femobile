import { httpClient } from './httpClient';

// Request status types
export type RequestStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

// Employee request interfaces
export interface EmployeeRequest {
  requestId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: number;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  price: number;
  notes?: string;
  isUrgent: boolean;
  distance?: number;
  customerRating?: number;
  customerCompletedJobs?: number;
  status: RequestStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface RequestActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class EmployeeRequestService {
  /**
   * Get all pending requests for employee
   */
  async getPendingRequests(): Promise<EmployeeRequest[]> {
    try {
      const response = await httpClient.get<ApiResponse<EmployeeRequest[]>>('/employee/requests/pending');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw new Error('Không thể tải danh sách yêu cầu mới');
    }
  }

  /**
   * Get accepted requests for employee
   */
  async getAcceptedRequests(): Promise<EmployeeRequest[]> {
    try {
      const response = await httpClient.get<ApiResponse<EmployeeRequest[]>>('/employee/requests/accepted');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching accepted requests:', error);
      throw new Error('Không thể tải danh sách yêu cầu đã nhận');
    }
  }

  /**
   * Get completed requests for employee
   */
  async getCompletedRequests(): Promise<EmployeeRequest[]> {
    try {
      const response = await httpClient.get<ApiResponse<EmployeeRequest[]>>('/employee/requests/completed');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching completed requests:', error);
      throw new Error('Không thể tải danh sách công việc đã hoàn thành');
    }
  }

  /**
   * Accept a request
   */
  async acceptRequest(requestId: string): Promise<RequestActionResponse> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(`/employee/requests/${requestId}/accept`, {});
      return {
        success: response.data?.success || false,
        message: response.data?.message || 'Unknown error',
        data: response.data?.data
      };
    } catch (error) {
      console.error('Error accepting request:', error);
      throw new Error('Không thể nhận yêu cầu này');
    }
  }

  /**
   * Decline a request
   */
  async declineRequest(requestId: string, reason?: string): Promise<RequestActionResponse> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(`/employee/requests/${requestId}/decline`, {
        reason
      });
      return {
        success: response.data?.success || false,
        message: response.data?.message || 'Unknown error',
        data: response.data?.data
      };
    } catch (error) {
      console.error('Error declining request:', error);
      throw new Error('Không thể từ chối yêu cầu này');
    }
  }

  /**
   * Cancel an accepted request
   */
  async cancelRequest(requestId: string, reason?: string): Promise<RequestActionResponse> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(`/employee/requests/${requestId}/cancel`, {
        reason
      });
      return {
        success: response.data?.success || false,
        message: response.data?.message || 'Unknown error',
        data: response.data?.data
      };
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw new Error('Không thể hủy yêu cầu này');
    }
  }

  /**
   * Complete a request
   */
  async completeRequest(requestId: string, notes?: string): Promise<RequestActionResponse> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(`/employee/requests/${requestId}/complete`, {
        notes
      });
      return {
        success: response.data?.success || false,
        message: response.data?.message || 'Unknown error',
        data: response.data?.data
      };
    } catch (error) {
      console.error('Error completing request:', error);
      throw new Error('Không thể hoàn thành yêu cầu này');
    }
  }

  /**
   * Get request details by ID
   */
  async getRequestDetails(requestId: string): Promise<EmployeeRequest> {
    try {
      const response = await httpClient.get<ApiResponse<EmployeeRequest>>(`/employee/requests/${requestId}`);
      if (!response.data?.data) {
        throw new Error('No data received from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching request details:', error);
      throw new Error('Không thể tải chi tiết yêu cầu');
    }
  }
}

export const employeeRequestService = new EmployeeRequestService();