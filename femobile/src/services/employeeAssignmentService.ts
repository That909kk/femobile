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

export interface AvailableBookingDetail {
  detailId: string;
  bookingCode: string;
  serviceName: string;
  address: string;
  bookingTime: string;
  estimatedDuration: number;
  quantity: number;
  price?: number;
}

export interface AvailableBookingsResponse {
  success: boolean;
  message: string;
  data: AvailableBookingDetail[];
  totalItems: number;
}

export interface AcceptBookingResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    bookingCode: string;
    serviceName: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: number;
    price: number;
  };
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    status: string;
    checkInTime: string;
    checkOutTime: string | null;
    bookingDetail: {
      detailId: string;
      serviceName: string;
      quantity: number;
      price: number;
      duration: string;
    };
    employee: {
      employeeId: string;
      fullName: string;
    };
    booking: {
      bookingId: string;
      bookingTime: string;
      customerName: string;
    };
  };
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    status: string;
    checkInTime: string;
    checkOutTime: string;
    bookingDetail: {
      detailId: string;
      serviceName: string;
      quantity: number;
      price: number;
      duration: string;
    };
    employee: {
      employeeId: string;
      fullName: string;
    };
    booking: {
      bookingId: string;
      bookingTime: string;
      customerName: string;
      status?: string;
    };
  };
}

export interface CancelAssignmentRequest {
  reason: string;
  employeeId: string;
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

    const response = await httpClient.get<AssignmentListResponse>(endpoint);

    if (!response.success || !response.data) {
      const error: any = new Error(response.message || 'Không thể tải danh sách công việc');
      error.status = response.status;
      throw error;
    }

    return response.data.data || [];
  }

  async cancelAssignment(
    assignmentId: string,
    employeeId: string,
    reason: string,
  ): Promise<boolean> {
    const response = await httpClient.post<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/assignments/${assignmentId}/cancel`,
      { reason, employeeId },
    );

    if (!response.success) {
      throw new Error(response.message || 'Không thể hủy công việc');
    }

    return response.data?.success ?? response.success;
  }

  async getAvailableBookings(
    employeeId: string,
    params?: { page?: number; size?: number },
  ): Promise<AvailableBookingsResponse> {
    const query = new URLSearchParams();
    query.append('employeeId', employeeId);
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());

    const endpoint = `${this.BASE_PATH}/available-bookings?${query.toString()}`;

    const response = await httpClient.get<AvailableBookingsResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách booking chờ');
    }

    return response.data;
  }

  async acceptBookingDetail(
    detailId: string,
    employeeId: string,
  ): Promise<AcceptBookingResponse> {
    const query = new URLSearchParams();
    query.append('employeeId', employeeId);

    const endpoint = `${this.BASE_PATH}/booking-details/${detailId}/accept?${query.toString()}`;

    const response = await httpClient.post<AcceptBookingResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể nhận công việc');
    }

    return response.data;
  }

  async checkIn(assignmentId: string, employeeId: string): Promise<CheckInResponse> {
    const response = await httpClient.post<CheckInResponse>(
      `${this.BASE_PATH}/assignments/${assignmentId}/check-in`,
      { employeeId },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể check-in');
    }

    return response.data;
  }

  async checkOut(assignmentId: string, employeeId: string): Promise<CheckOutResponse> {
    const response = await httpClient.post<CheckOutResponse>(
      `${this.BASE_PATH}/assignments/${assignmentId}/check-out`,
      { employeeId },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể check-out');
    }

    return response.data;
  }
}

export const employeeAssignmentService = new EmployeeAssignmentService();
