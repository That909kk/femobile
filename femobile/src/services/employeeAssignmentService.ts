import { httpClient } from './httpClient';
import type { BookingResponse } from '../types/booking';

export type AssignmentStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EmployeeAssignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  bookingTime: string;
  status: AssignmentStatus;
  estimatedDurationHours: number;
  pricePerUnit: number;
  quantity: number;
  totalAmount: number;
  note?: string;
  assignedAt?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInImages?: Array<{
    imageId: string;
    imageUrl: string;
    imageDescription?: string;
    uploadedAt: string;
  }>;
  checkOutImages?: Array<{
    imageId: string;
    imageUrl: string;
    imageDescription?: string;
    uploadedAt: string;
  }>;
}

export interface AssignmentDetailResponse {
  assignmentId: string;
  status: AssignmentStatus;
  checkInTime?: string;
  checkOutTime?: string;
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
  checkInImages?: Array<{
    imageId: string;
    imageUrl: string;
    imageDescription?: string;
    uploadedAt: string;
  }>;
  checkOutImages?: Array<{
    imageId: string;
    imageUrl: string;
    imageDescription?: string;
    uploadedAt: string;
  }>;
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
  data: AssignmentDetailResponse;
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  data: AssignmentDetailResponse;
}

export interface CancelAssignmentRequest {
  reason: string;
  employeeId: string;
}

export interface AssignmentStatistics {
  timeUnit: string;
  startDate: string;
  endDate: string;
  totalAssignments: number;
  countByStatus: {
    PENDING: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
    NO_SHOW: number;
  };
}

export interface StatisticsResponse {
  success: boolean;
  data: AssignmentStatistics;
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

    // API endpoint theo document: GET /api/v1/employee/{employeeId}/assignments
    const endpoint = `${this.BASE_PATH}/${employeeId}/assignments${
      query.toString() ? `?${query.toString()}` : ''
    }`;

    console.log('[EmployeeAssignmentService] Calling endpoint:', endpoint);

    const response = await httpClient.get<any>(endpoint);

    console.log('[EmployeeAssignmentService] Response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
    });

    if (!response.success) {
      const error: any = new Error(response.message || 'Không thể tải danh sách công việc');
      error.status = response.status;
      throw error;
    }

    // Response format theo API doc: 
    // { success: true, message: "...", data: [...], totalItems: 1 }
    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data)) {
      console.log('[EmployeeAssignmentService] Returning assignments:', response.data.length);
      return response.data;
    }

    console.warn('[EmployeeAssignmentService] Unexpected response format:', response.data);
    return [];
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

  async checkIn(
    assignmentId: string,
    employeeId: string,
    imageFiles?: Array<File | Blob>,
    imageDescription?: string,
  ): Promise<CheckInResponse> {
    const formData = new FormData();
    const requestData = { employeeId, imageDescription };
    formData.append('request', JSON.stringify(requestData));
    
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append('images', file as any);
      });
    }

    const response = await httpClient.post<CheckInResponse>(
      `${this.BASE_PATH}/assignments/${assignmentId}/check-in`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể check-in');
    }

    return response.data;
  }

  async checkOut(
    assignmentId: string,
    employeeId: string,
    imageFiles?: Array<File | Blob>,
    imageDescription?: string,
  ): Promise<CheckOutResponse> {
    const formData = new FormData();
    const requestData = { employeeId, imageDescription };
    formData.append('request', JSON.stringify(requestData));
    
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append('images', file as any);
      });
    }

    const response = await httpClient.post<CheckOutResponse>(
      `${this.BASE_PATH}/assignments/${assignmentId}/check-out`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể check-out');
    }

    return response.data;
  }

  /**
   * Accept assignment (for PENDING status)
   * @param assignmentId - ID của assignment cần chấp nhận
   * @param employeeId - ID của employee chấp nhận
   */
  async acceptAssignment(
    assignmentId: string,
    employeeId: string,
  ): Promise<AssignmentDetailResponse> {
    const query = new URLSearchParams();
    query.append('employeeId', employeeId);

    const endpoint = `${this.BASE_PATH}/assignments/${assignmentId}/accept?${query.toString()}`;

    const response = await httpClient.post<{
      success: boolean;
      message: string;
      data: AssignmentDetailResponse;
    }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể chấp nhận công việc');
    }

    return response.data.data;
  }

  /**
   * Get employee bookings (danh sách booking mà employee được phân công)
   * @param employeeId - ID của employee
   * @param params - Tham số phân trang và lọc
   */
  async getEmployeeBookings(
    employeeId: string,
    params?: { page?: number; size?: number; fromDate?: string },
  ): Promise<{
    data: BookingResponse[];
    totalPages: number;
    totalItems: number;
    currentPage: number;
    success: boolean;
  }> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());
    if (params?.fromDate) query.append('fromDate', params.fromDate);

    const endpoint = `${this.BASE_PATH}/bookings/${employeeId}${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await httpClient.get<{
      data: BookingResponse[];
      totalPages: number;
      totalItems: number;
      currentPage: number;
      success: boolean;
    }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách booking');
    }

    return response.data;
  }

  /**
   * Get verified awaiting employee bookings
   * @param params - Tham số lọc và phân trang
   */
  async getVerifiedAwaitingEmployeeBookings(params?: {
    fromDate?: string;
    page?: number;
    size?: number;
    matchEmployeeZones?: boolean;
  }): Promise<{
    data: BookingResponse[];
    totalPages: number;
    totalItems: number;
    currentPage: number;
    success: boolean;
  }> {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());
    if (typeof params?.matchEmployeeZones === 'boolean')
      query.append('matchEmployeeZones', params.matchEmployeeZones.toString());

    const endpoint = `/employee/bookings/verified-awaiting-employee${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await httpClient.get<any>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Không thể tải danh sách booking chờ phân công');
    }

    // API response structure:
    // httpClient returns: { success: true, data: <raw API response>, message: "" }
    // Raw API response is: { data: [...], totalPages, totalItems, currentPage, success }
    
    const responseAny = response as any;
    
    console.log('Service full response:', {
      hasData: !!response.data,
      dataType: typeof response.data,
      isDataArray: Array.isArray(response.data),
      responseTotalPages: responseAny.totalPages,
      responseTotalItems: responseAny.totalItems,
      responseCurrentPage: responseAny.currentPage,
    });

    // Get pagination from top level (httpClient might expose them)
    const totalPages = responseAny.totalPages || response.data?.totalPages || 0;
    const totalItems = responseAny.totalItems || response.data?.totalItems || 0;
    const currentPage = responseAny.currentPage ?? response.data?.currentPage ?? 0;

    // Get data array
    let dataArray: any[] = [];
    if (Array.isArray(response.data)) {
      dataArray = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      dataArray = response.data.data;
    }

    // Unwrap nested booking data
    const bookings = dataArray.map((item: any) => {
      if (item.data && typeof item.data === 'object') {
        return item.data;
      }
      return item;
    });

    console.log('Service processed:', {
      bookingsCount: bookings.length,
      totalPages,
      totalItems,
      currentPage,
    });

    return {
      data: bookings,
      totalPages,
      totalItems,
      currentPage,
      success: true,
    };
  }

  /**
   * Get booking details for employee
   * @param bookingId - ID của booking
   */
  async getEmployeeBookingDetails(bookingId: string): Promise<BookingResponse> {
    const endpoint = `/employee/bookings/details/${bookingId}`;

    const response = await httpClient.get<BookingResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải chi tiết booking');
    }

    return response.data;
  }

  /**
   * Lấy thống kê assignments theo trạng thái
   * @param employeeId - ID nhân viên
   * @param timeUnit - Đơn vị thời gian: DAY, WEEK, MONTH, YEAR
   * @param startDate - Ngày bắt đầu (optional)
   * @param endDate - Ngày kết thúc (optional)
   */
  async getAssignmentStatistics(
    employeeId: string,
    timeUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH',
    startDate?: string,
    endDate?: string,
  ): Promise<AssignmentStatistics> {
    const query = new URLSearchParams();
    query.append('timeUnit', timeUnit);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    const endpoint = `${this.BASE_PATH}/${employeeId}/assignments/statistics?${query.toString()}`;

    const response = await httpClient.get<AssignmentStatistics>(endpoint);

    if (!response.success || !response.data) {
      const error: any = new Error('Không thể tải thống kê công việc');
      error.status = response.status;
      throw error;
    }

    return response.data;
  }
}

export const employeeAssignmentService = new EmployeeAssignmentService();
