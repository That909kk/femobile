import { httpClient } from './httpClient';
import {
  BookingAssignment,
  BookingAddress,
  BookingRequest,
  BookingResponse,
  BookingValidationRequest,
  BookingValidationResponse,
  DefaultAddressResponse,
  NewBookingAddress,
  PaymentMethod,
  BookingEmployee,
} from '../types/booking';
import {
  BookingPreviewRequest,
  BookingPreviewResponse,
  MultipleBookingPreviewRequest,
  MultipleBookingPreviewResponse,
  RecurringBookingPreviewRequest,
  RecurringBookingPreviewResponse,
} from '../types/bookingPreview';
import { paymentService } from './paymentService';

export interface Address extends BookingAddress {}
export interface NewAddress extends NewBookingAddress {}
export interface Assignment extends BookingAssignment {}
export interface Employee extends BookingEmployee {}

export interface CustomerBookingsResponse {
  content: BookingResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  empty: boolean;
  last?: boolean;
}

export interface BookingStatisticsResponse {
  success: boolean;
  data: {
    timeUnit: string;
    startDate: string;
    endDate: string;
    totalBookings: number;
    countByStatus: {
      PENDING?: number;
      AWAITING_EMPLOYEE?: number;
      CONFIRMED?: number;
      IN_PROGRESS?: number;
      COMPLETED?: number;
      CANCELLED?: number;
    };
  };
}

class BookingService {
  private readonly BASE_PATH = '/customer/bookings';

  async getDefaultAddress(customerId: string): Promise<DefaultAddressResponse | null> {
    const response = await httpClient.get<DefaultAddressResponse | null>(
      `${this.BASE_PATH}/${customerId}/default-address`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the lay dia chi mac dinh');
    }

    return response.data ?? null;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return paymentService.getPaymentMethods();
  }

  async createBooking(
    bookingData: BookingRequest,
    images?: Array<{ uri: string; name: string; type: string }>
  ): Promise<BookingResponse> {
    // Gửi dưới dạng multipart/form-data để tương thích với backend
    const formData = new FormData();
    
    // Tạo JSON string cho booking data
    const bookingJson = JSON.stringify(bookingData);
    formData.append('booking', bookingJson);

    // Thêm ảnh nếu có
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);
      });
    }

    const response = await httpClient.post<BookingResponse>(this.BASE_PATH, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tao lich dat');
    }

    return response.data;
  }

  async createBookingWithImage(
    bookingData: BookingRequest,
    imageFile?: File | Blob,
  ): Promise<BookingResponse> {
    const formData = new FormData();
    
    // Tạo JSON string cho booking data
    const bookingJson = JSON.stringify(bookingData);
    formData.append('booking', bookingJson);
    
    // Thêm image nếu có
    if (imageFile) {
      formData.append('image', imageFile as any);
    }

    const response = await httpClient.post<BookingResponse>(this.BASE_PATH, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tao lich dat');
    }

    return response.data;
  }

  async getBookingById(bookingId: string): Promise<BookingResponse> {
    const response = await httpClient.get<BookingResponse>(`${this.BASE_PATH}/${bookingId}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong tim thay thong tin dat lich');
    }

    return response.data;
  }

  async validateBooking(request: BookingValidationRequest): Promise<BookingValidationResponse> {
    const response = await httpClient.post<BookingValidationResponse>(
      `${this.BASE_PATH}/validate`,
      request,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the xac thuc dat lich');
    }

    return response.data;
  }

  async getCustomerBookings(
    customerId: string,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      sort?: string;
      fromDate?: string;
    },
  ): Promise<CustomerBookingsResponse> {
    const queryParams = new URLSearchParams();
    if (typeof params?.page === 'number') {
      queryParams.append('page', params.page.toString());
    }
    if (typeof params?.size === 'number') {
      queryParams.append('size', params.size.toString());
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params?.fromDate) {
      queryParams.append('fromDate', params.fromDate);
    }

    const queryString = queryParams.toString();
    // API endpoint: GET /api/v1/customer/bookings/customer/{customerId}
    const endpoint = `/customer/bookings/customer/${customerId}${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<CustomerBookingsResponse>(endpoint);

    // API returns pagination response directly without wrapper
    // Response structure: { content: [], totalElements, totalPages, last, ... }
    if (response.data) {
      return response.data;
    }
    
    // If response has wrapper (success/data structure), extract data
    if (!response.success) {
      throw new Error(response.message || 'Khong the lay danh sach don dat');
    }

    // Fallback: return empty result
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: params?.size || 10,
      empty: true,
      last: true,
    };
  }

  async getBookingStatistics(
    customerId: string,
    timeUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    startDate?: string,
    endDate?: string,
  ): Promise<BookingStatisticsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('timeUnit', timeUnit);
    
    if (startDate) {
      queryParams.append('startDate', startDate);
    }
    if (endDate) {
      queryParams.append('endDate', endDate);
    }

    const queryString = queryParams.toString();
    const endpoint = `/customer/${customerId}/bookings/statistics${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<BookingStatisticsResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay thong ke booking');
    }

    return response.data as BookingStatisticsResponse;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    const response = await httpClient.put<{ success: boolean }>(
      `${this.BASE_PATH}/${bookingId}/cancel`,
      reason ? { reason } : {},
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the huy don dat');
    }

    return response.data?.success ?? response.success;
  }

  async convertToPost(
    bookingId: string,
    data: { title: string; imageUrl?: string },
  ): Promise<BookingResponse> {
    const response = await httpClient.put<BookingResponse>(
      `${this.BASE_PATH}/${bookingId}/convert-to-post`,
      data,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the chuyen thanh bai post');
    }

    return response.data;
  }

  async updateBooking(
    bookingId: string,
    updates: Partial<BookingRequest>,
  ): Promise<BookingResponse> {
    const response = await httpClient.patch<BookingResponse>(
      `${this.BASE_PATH}/${bookingId}`,
      updates,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the cap nhat don dat');
    }

    return response.data;
  }

  async uploadImage(
    bookingId: string,
    imageFile: File | Blob,
  ): Promise<{ bookingId: string; imageUrl: string; publicId: string }> {
    const formData = new FormData();
    formData.append('file', imageFile as any);

    const response = await httpClient.postFormData<{
      bookingId: string;
      imageUrl: string;
      publicId: string;
    }>(`${this.BASE_PATH}/${bookingId}/upload-image`, formData);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai anh len');
    }

    return response.data;
  }

  async getVerifiedAwaitingBookings(params?: {
    page?: number;
    size?: number;
  }): Promise<{ data: BookingResponse[] }> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());

    const endpoint = `/employee/bookings/verified-awaiting-employee${
      query.toString() ? `?${query.toString()}` : ''
    }`;

    const response = await httpClient.get<{ data: BookingResponse[] }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach bai dang');
    }

    return response.data;
  }

  async createMultipleBookings(
    bookingData: any,
    images?: Array<{ uri: string; name: string; type: string }>,
  ): Promise<any> {
    const formData = new FormData();
    
    const bookingJson = JSON.stringify(bookingData);
    formData.append('booking', bookingJson);
    
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);
      });
    }

    const response = await httpClient.post<any>(
      `${this.BASE_PATH}/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tao cac lich dat');
    }

    return response.data;
  }

  async createRecurringBooking(
    customerId: string,
    bookingData: BookingRequest
  ): Promise<BookingResponse> {
    const endpoint = `/customer/recurring-bookings/${customerId}`;
    
    // Recurring booking needs very long timeout because backend creates multiple booking instances
    // nginx gateway timeout is 60s by default, backend may need more time
    // Increased to 180 seconds (3 minutes) to handle large recurring schedules
    const response = await httpClient.post<BookingResponse>(endpoint, bookingData, {
      timeout: 180000, // 180 seconds (3 minutes) for recurring booking creation
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong te tao lich dinh ky');
    }

    return response.data;
  }

  async findSuitableEmployees(params: {
    serviceId: number;
    bookingTime?: string;
    bookingTimes?: string[];
    ward: string;
    city: string;
    customerId?: string;
  }): Promise<any[]> {
    // Build query string manually WITHOUT any encoding - send raw Vietnamese characters
    const queryParts: string[] = [];
    queryParts.push(`serviceId=${params.serviceId}`);
    queryParts.push(`ward=${params.ward}`); // Raw Vietnamese with spaces
    queryParts.push(`city=${params.city}`); // Raw Vietnamese with spaces
    
    if (params.customerId) {
      queryParts.push(`customerId=${params.customerId}`);
    }
    
    if (params.bookingTime) {
      queryParts.push(`bookingTime=${params.bookingTime}`);
    }
    
    if (params.bookingTimes && params.bookingTimes.length > 0) {
      params.bookingTimes.forEach(time => {
        queryParts.push(`bookingTimes=${time}`);
      });
    }

    const endpoint = `/customer/services/employee/suitable?${queryParts.join('&')}`;
    const response = await httpClient.get<any[]>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Khong the tim nhan vien phu hop');
    }

    return response.data || [];
  }

  /**
   * Get booking details for employee
   * @param bookingId - ID của booking
   */
  async getEmployeeBookingDetails(bookingId: string): Promise<BookingResponse> {
    const endpoint = `/employee/bookings/details/${bookingId}`;

    const response = await httpClient.get<{
      success: boolean;
      message: string;
      data: BookingResponse;
    }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai chi tiet booking');
    }

    return response.data.data;
  }

  // ============ BOOKING PREVIEW APIs ============

  /**
   * Preview single booking - xem trước phí chi tiết
   * POST /api/v1/customer/bookings/preview
   */
  async getBookingPreview(request: BookingPreviewRequest): Promise<BookingPreviewResponse> {
    console.log('[BookingService] Getting booking preview:', request);
    
    const response = await httpClient.post<BookingPreviewResponse>(
      `${this.BASE_PATH}/preview`,
      request
    );

    if (!response.success && !response.data) {
      // Return error response structure
      return {
        valid: false,
        errors: [response.message || 'Không thể lấy thông tin preview'],
        customerId: null,
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        addressInfo: null,
        usingNewAddress: false,
        bookingTime: null,
        serviceItems: null,
        totalServices: 0,
        totalQuantity: 0,
        subtotal: null,
        formattedSubtotal: null,
        promotionInfo: null,
        discountAmount: null,
        formattedDiscountAmount: null,
        totalAfterDiscount: null,
        formattedTotalAfterDiscount: null,
        feeBreakdowns: null,
        totalFees: null,
        formattedTotalFees: null,
        grandTotal: null,
        formattedGrandTotal: null,
        estimatedDuration: null,
        recommendedStaff: 0,
        note: null,
        paymentMethodId: null,
        paymentMethodName: null
      };
    }

    console.log('[BookingService] Preview response:', response.data);
    return response.data as BookingPreviewResponse;
  }

  /**
   * Preview multiple bookings - xem trước phí cho nhiều booking
   * POST /api/v1/customer/bookings/preview/multiple
   */
  async getMultipleBookingPreview(request: MultipleBookingPreviewRequest): Promise<MultipleBookingPreviewResponse> {
    console.log('[BookingService] Getting multiple booking preview:', request);
    
    const response = await httpClient.post<MultipleBookingPreviewResponse>(
      `${this.BASE_PATH}/preview/multiple`,
      request
    );

    if (!response.success && !response.data) {
      throw new Error(response.message || 'Không thể lấy thông tin preview');
    }

    console.log('[BookingService] Multiple preview response:', response.data);
    return response.data as MultipleBookingPreviewResponse;
  }

  /**
   * Preview recurring booking - xem trước phí cho đặt lịch định kỳ
   * POST /api/v1/customer/bookings/preview/recurring
   */
  async getRecurringBookingPreview(request: RecurringBookingPreviewRequest): Promise<RecurringBookingPreviewResponse> {
    console.log('[BookingService] Getting recurring booking preview:', request);
    
    const response = await httpClient.post<RecurringBookingPreviewResponse>(
      `${this.BASE_PATH}/preview/recurring`,
      request
    );

    if (!response.success && !response.data) {
      throw new Error(response.message || 'Không thể lấy thông tin preview');
    }

    console.log('[BookingService] Recurring preview response:', response.data);
    return response.data as RecurringBookingPreviewResponse;
  }
}

export const bookingService = new BookingService();
