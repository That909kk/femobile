import { httpClient } from './httpClient';
import type { PaymentMethod } from '../types/booking';

export interface PaymentRecord {
  paymentId: string;
  bookingId: string;
  bookingCode: string;
  amount: number;
  formattedAmount?: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  paymentMethodName: string;
  transactionCode?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface PaymentHistoryResponse {
  content: PaymentRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  empty: boolean;
}

class PaymentService {
  private readonly BASE_PATH = '/customer/payments';

  async getPaymentHistory(
    customerId: string,
    params?: { page?: number; size?: number; sort?: string },
  ): Promise<PaymentHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (typeof params?.page === 'number') {
        queryParams.append('page', params.page.toString());
      }
      if (typeof params?.size === 'number') {
        queryParams.append('size', params.size.toString());
      }
      if (params?.sort) {
        queryParams.append('sort', params.sort);
      }

      const queryString = queryParams.toString();
      const endpoint = `${this.BASE_PATH}/history/${customerId}${queryString ? `?${queryString}` : ''}`;
      const response = await httpClient.get<PaymentHistoryResponse>(endpoint);

      if (!response.success) {
        // Log specific payment errors but return empty result instead of throwing
        console.warn('Payment history error:', response.message);
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: params?.size || 10,
          empty: true,
        };
      }

      if (!response.data) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: params?.size || 10,
          empty: true,
        };
      }

      return response.data;
    } catch (error) {
      console.warn('Payment history fetch failed:', error);
      // Return empty result instead of throwing to avoid blocking UI
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: params?.size || 10,
        empty: true,
      };
    }
  }

  async getPaymentForBooking(bookingId: string): Promise<PaymentRecord | null> {
    const response = await httpClient.get<PaymentRecord | null>(
      `${this.BASE_PATH}/booking/${bookingId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the lay thong tin thanh toan');
    }

    return response.data ?? null;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await httpClient.get<PaymentMethod[]>(`${this.BASE_PATH}/methods`);
    if (!response.success) {
      throw new Error(response.message || 'Khong the tai phuong thuc thanh toan');
    }

    return response.data ?? [];
  }
}

export const paymentService = new PaymentService();
