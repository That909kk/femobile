import { httpClient } from './httpClient';
import type {
  RecurringBookingRequest,
  RecurringBookingResponse,
  RecurringBookingListPayload,
  CancelRecurringBookingRequest,
} from '../types/recurringBooking';

interface RecurringBookingListResult {
  data: RecurringBookingResponse[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

class RecurringBookingService {
  private readonly BASE_PATH = '/customer/recurring-bookings';

  async getRecurringBookings(
    customerId: string,
    params?: { page?: number; size?: number },
  ): Promise<RecurringBookingListResult> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') {
      query.append('page', params.page.toString());
    }
    if (typeof params?.size === 'number') {
      query.append('size', params.size.toString());
    }

    const endpoint = `${this.BASE_PATH}/${customerId}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await httpClient.get<RecurringBookingListPayload>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải lịch định kỳ');
    }

    const payload = response.data;
    return {
      data: payload.data ?? [],
      currentPage: payload.currentPage ?? 0,
      totalItems: payload.totalItems ?? payload.data?.length ?? 0,
      totalPages: payload.totalPages ?? 1,
    };
  }

  async getRecurringBookingDetail(
    customerId: string,
    recurringBookingId: string,
  ): Promise<RecurringBookingResponse> {
    const response = await httpClient.get<RecurringBookingResponse>(
      `${this.BASE_PATH}/${customerId}/${recurringBookingId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể lấy chi tiết lịch định kỳ');
    }

    return response.data;
  }

  async createRecurringBooking(
    customerId: string,
    payload: RecurringBookingRequest,
  ): Promise<RecurringBookingResponse> {
    const response = await httpClient.post<any>(`${this.BASE_PATH}/${customerId}`, payload);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tạo lịch định kỳ');
    }

    const data = response.data;
    if (data.recurringBooking) {
      return data.recurringBooking as RecurringBookingResponse;
    }

    if (data.data?.recurringBooking) {
      return data.data.recurringBooking as RecurringBookingResponse;
    }

    return data as RecurringBookingResponse;
  }

  async cancelRecurringBooking(
    customerId: string,
    recurringBookingId: string,
    body: CancelRecurringBookingRequest,
  ): Promise<RecurringBookingResponse> {
    const response = await httpClient.put<any>(
      `${this.BASE_PATH}/${customerId}/${recurringBookingId}/cancel`,
      body,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể hủy lịch định kỳ');
    }

    if (response.data.recurringBooking) {
      return response.data.recurringBooking as RecurringBookingResponse;
    }

    if (response.data.data?.recurringBooking) {
      return response.data.data.recurringBooking as RecurringBookingResponse;
    }

    return response.data as RecurringBookingResponse;
  }
}

export const recurringBookingService = new RecurringBookingService();
