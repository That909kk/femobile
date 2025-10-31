import { httpClient } from './httpClient';

export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EmployeeAssignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  status: AssignmentStatus;
  estimatedDuration: number;
  price: number;
  notes?: string;
}

export interface AssignmentListResponse {
  success: boolean;
  message: string;
  data: EmployeeAssignment[];
  totalItems?: number;
}

export interface AvailableBooking {
  bookingId: string;
  bookingCode: string;
  title?: string;
  imageUrl?: string;
  serviceName: string;
  address: string;
  bookingTime: string;
  totalAmount: number;
  formattedTotalAmount: string;
  customerName: string;
  requiredEmployees: number;
  status: string;
  createdAt: string;
}

export interface AvailableBookingsResponse {
  success: boolean;
  message: string;
  data: AvailableBooking[];
}

export interface CheckInOutResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    status: string;
    checkedInAt?: string;
    checkedOutAt?: string;
  };
}

class EmployeeAssignmentService {
  private readonly BASE_PATH = '/employee';

  async getAssignments(
    employeeId: string,
    params?: { status?: AssignmentStatus; page?: number; size?: number; sort?: string },
  ): Promise<EmployeeAssignment[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());
    if (params?.sort) query.append('sort', params.sort);

    const endpoint = `${this.BASE_PATH}/${employeeId}/assignments${
      query.toString() ? `?${query.toString()}` : ''
    }`;

    const response = await httpClient.get<EmployeeAssignment[]>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach cong viec');
    }

    return response.data;
  }

  async cancelAssignment(assignmentId: string, reason?: string): Promise<boolean> {
    const response = await httpClient.post<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/assignments/${assignmentId}/cancel`,
      reason ? { reason } : {},
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the huy cong viec');
    }

    return response.data?.success ?? response.success;
  }

  async getAvailableBookings(): Promise<AvailableBooking[]> {
    const response = await httpClient.get<AvailableBooking[]>(
      `${this.BASE_PATH}/available-bookings`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach bai dang');
    }

    return response.data;
  }

  /**
   * Lấy danh sách booking đã được admin xác minh và đang chờ nhân viên
   */
  async getVerifiedAwaitingBookings(params?: {
    page?: number;
    size?: number;
  }): Promise<{ data: any[]; currentPage: number; totalItems: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());

    const endpoint = `${this.BASE_PATH}/bookings/verified-awaiting-employee${
      query.toString() ? `?${query.toString()}` : ''
    }`;

    const response = await httpClient.get<{
      data: any[];
      currentPage: number;
      totalItems: number;
      totalPages: number;
    }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach booking da xac minh');
    }

    return response.data;
  }

  async acceptBookingDetail(detailId: string): Promise<boolean> {
    const response = await httpClient.post<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/booking-details/${detailId}/accept`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the nhan cong viec');
    }

    return response.data?.success ?? response.success;
  }

  async checkIn(
    assignmentId: string,
  ): Promise<{ assignmentId: string; status: string; checkedInAt?: string }> {
    const response = await httpClient.post<{
      assignmentId: string;
      status: string;
      checkedInAt?: string;
    }>(`${this.BASE_PATH}/assignments/${assignmentId}/check-in`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the check-in');
    }

    return response.data;
  }

  async checkOut(
    assignmentId: string,
  ): Promise<{ assignmentId: string; status: string; checkedOutAt?: string }> {
    const response = await httpClient.post<{
      assignmentId: string;
      status: string;
      checkedOutAt?: string;
    }>(`${this.BASE_PATH}/assignments/${assignmentId}/check-out`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the check-out');
    }

    return response.data;
  }
}

export const employeeAssignmentService = new EmployeeAssignmentService();
