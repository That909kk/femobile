import { httpClient } from './httpClient';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

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

class EmployeeRequestService {
  async getPendingRequests(): Promise<EmployeeRequest[]> {
    try {
      const response = await httpClient.get<EmployeeRequest[]>('/employee/requests/pending');
      if (!response.success) {
        console.error('Error loading requests:', response.message);
        return [];
      }
      return response.data ?? [];
    } catch (error) {
      console.error('Error loading requests:', error);
      return [];
    }
  }

  async getAcceptedRequests(): Promise<EmployeeRequest[]> {
    try {
      const response = await httpClient.get<EmployeeRequest[]>('/employee/requests/accepted');
      if (!response.success) {
        console.error('Error loading accepted requests:', response.message);
        return [];
      }
      return response.data ?? [];
    } catch (error) {
      console.error('Error loading accepted requests:', error);
      return [];
    }
  }

  async getCompletedRequests(): Promise<EmployeeRequest[]> {
    try {
      const response = await httpClient.get<EmployeeRequest[]>('/employee/requests/completed');
      if (!response.success) {
        console.error('Error loading completed requests:', response.message);
        return [];
      }
      return response.data ?? [];
    } catch (error) {
      console.error('Error loading completed requests:', error);
      return [];
    }
  }

  async acceptRequest(requestId: string): Promise<RequestActionResponse> {
    const response = await httpClient.post<RequestActionResponse>(
      `/employee/requests/${requestId}/accept`,
      {},
    );
    if (!response.success) {
      throw new Error(response.message || 'Khong the nhan yeu cau');
    }

    return response.data ?? { success: response.success, message: response.message };
  }

  async declineRequest(requestId: string, reason?: string): Promise<RequestActionResponse> {
    const response = await httpClient.post<RequestActionResponse>(
      `/employee/requests/${requestId}/decline`,
      { reason },
    );
    if (!response.success) {
      throw new Error(response.message || 'Khong the tu choi yeu cau');
    }

    return response.data ?? { success: response.success, message: response.message };
  }

  async cancelRequest(requestId: string, reason?: string): Promise<RequestActionResponse> {
    const response = await httpClient.post<RequestActionResponse>(
      `/employee/requests/${requestId}/cancel`,
      { reason },
    );
    if (!response.success) {
      throw new Error(response.message || 'Khong the huy yeu cau');
    }

    return response.data ?? { success: response.success, message: response.message };
  }

  async completeRequest(requestId: string, notes?: string): Promise<RequestActionResponse> {
    const response = await httpClient.post<RequestActionResponse>(
      `/employee/requests/${requestId}/complete`,
      { notes },
    );
    if (!response.success) {
      throw new Error(response.message || 'Khong the hoan thanh yeu cau');
    }

    return response.data ?? { success: response.success, message: response.message };
  }

  async getRequestDetails(requestId: string): Promise<EmployeeRequest> {
    const response = await httpClient.get<EmployeeRequest>(`/employee/requests/${requestId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay chi tiet yeu cau');
    }

    return response.data;
  }
}

export const employeeRequestService = new EmployeeRequestService();
