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

  async validateBooking(
    validationData: BookingValidationRequest,
  ): Promise<BookingValidationResponse> {
    const response = await httpClient.post<BookingValidationResponse>(
      `${this.BASE_PATH}/validate`,
      validationData,
    );

    if (!response.success && response.data) {
      // Validation endpoints often return HTTP 200 with success=false for business errors
      return response.data;
    }

    if (!response.success) {
      throw new Error(response.message || 'Khong the xac thuc thong tin dat lich');
    }

    return response.data!;
  }

  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const response = await httpClient.post<BookingResponse>(this.BASE_PATH, bookingData);

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

  async getCustomerBookings(
    customerId: string,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      sort?: string;
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

    const queryString = queryParams.toString();
    const endpoint = `${this.BASE_PATH}/customer/${customerId}${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<CustomerBookingsResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay danh sach don dat');
    }

    return response.data;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    const response = await httpClient.patch<{ success: boolean }>(
      `${this.BASE_PATH}/${bookingId}/cancel`,
      reason ? { reason } : undefined,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the huy don dat');
    }

    return response.data?.success ?? response.success;
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
}

export const bookingService = new BookingService();
