import { httpClient } from './httpClient';
import {
  BookingAddress,
  NewBookingAddress,
  BookingDetail,
  BookingAssignment,
  BookingRequest,
  BookingValidationRequest,
  BookingResponse,
  BookingValidationResponse,
  PaymentMethod,
  BookingEmployee,
  DefaultAddressResponse
} from '../types/booking';

// Legacy types for backward compatibility
export interface Address extends BookingAddress {}
export interface NewAddress extends NewBookingAddress {}
export interface Assignment extends BookingAssignment {}
export interface Employee extends BookingEmployee {}

class BookingService {
  private readonly BASE_PATH = '/customer';

  /**
   * Get customer's default address
   */
  async getDefaultAddress(customerId: string): Promise<DefaultAddressResponse> {
    const endpoint = `${this.BASE_PATH}/bookings/${customerId}/default-address`;
    console.log('📍 Getting default address:', {
      customerId,
      endpoint,
      basePath: this.BASE_PATH
    });
    
    const response = await httpClient.get<DefaultAddressResponse>(endpoint);
    console.log('📍 API Response structure:', response);
    console.log('📍 Actual data:', response.data);
    return response.data!;
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods() {
    console.log('💳 Getting payment methods...');
    try {
      // Log the exact URL being called
      const endpoint = '/customer/payments/methods';
      console.log('💳 Endpoint:', endpoint);
      console.log('💳 Expected full URL should be: [baseURL]' + endpoint);
      
      const response = await httpClient.get<PaymentMethod[]>(endpoint);
      console.log('💳 Payment methods response:', response);
      console.log('💳 Response type:', typeof response);
      console.log('💳 Response keys:', Object.keys(response));
      
      // Check if response is already an array (direct data)
      if (Array.isArray(response)) {
        console.log('💳 Response is already an array, using directly');
        return response;
      }
      
      // Check if response has data property (ApiResponse wrapper)
      if (response.data && Array.isArray(response.data)) {
        console.log('💳 Response has data property, extracting');
        return response.data;
      }
      
      // If response has numeric keys (array-like object), convert to array
      const keys = Object.keys(response);
      if (keys.every(key => !isNaN(Number(key)))) {
        console.log('💳 Response has numeric keys, converting to array');
        const arrayData = keys.map(key => (response as any)[key]);
        console.log('💳 Converted array:', arrayData);
        return arrayData;
      }
      
      console.log('💳 Unexpected response structure, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Get suitable employees for booking
   */
  async getSuitableEmployees(params: {
    serviceId: number;
    bookingTime: string;
    district: string;
    city: string;
  }) {
    const { serviceId, bookingTime, district, city } = params;
    const queryParams = new URLSearchParams({
      serviceId: serviceId.toString(),
      bookingTime,
      district,
      city,
    });

    const response = await httpClient.get<{ employees: Employee[] }>(
      `/employee-schedule/suitable?${queryParams.toString()}`
    );
    return response;
  }

  /**
   * Validate booking request before creation
   */
  async validateBooking(validationData: BookingValidationRequest): Promise<BookingValidationResponse> {
    console.log('📋 Validating booking with data:', validationData);
    try {
      const endpoint = `${this.BASE_PATH}/bookings/validate`;
      console.log('📋 Validation endpoint:', endpoint);
      
      const response = await httpClient.post<BookingValidationResponse>(
        endpoint,
        validationData
      );
      
      console.log('📋 Validation API response:', response);
      console.log('📋 Response structure:', {
        hasSuccess: 'success' in response,
        hasData: 'data' in response,
        responseKeys: Object.keys(response)
      });
      
      // The validation endpoint returns data directly, not wrapped in ApiResponse
      return response.data || (response as unknown as BookingValidationResponse);
    } catch (error: any) {
      console.error('❌ Validation API error:', error);
      // If it's a validation error response, extract the validation data
      if (error?.response?.data) {
        console.log('📋 Error response data:', error.response.data);
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    console.log('📋 Creating booking with data:', bookingData);
    try {
      const endpoint = `${this.BASE_PATH}/bookings`;
      console.log('📋 Booking endpoint:', endpoint);
      
      const response = await httpClient.post<BookingResponse>(
        endpoint,
        bookingData
      );
      
      console.log('📋 Booking API response:', response);
      console.log('📋 Response structure:', {
        hasSuccess: 'success' in response,
        hasData: 'data' in response,
        responseKeys: Object.keys(response)
      });
      
      // Return the booking data - handle both direct response and wrapped response
      return response.data || (response as unknown as BookingResponse);
      
    } catch (error: any) {
      console.error('❌ Booking creation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Re-throw with more context if needed
      if (error.response?.data) {
        throw error; // Let the calling component handle the error response
      }
      
      throw new Error(error.message || 'Failed to create booking');
    }
  }

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId: string) {
    const response = await httpClient.get<BookingResponse>(
      `${this.BASE_PATH}/bookings/${bookingId}`
    );
    return response;
  }

  /**
   * Get customer bookings list
   */
  async getCustomerBookings(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `${this.BASE_PATH}/bookings/${customerId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await httpClient.get<{
      bookings: BookingResponse[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
    }>(url);
    return response;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string) {
    const response = await httpClient.patch<BookingResponse>(
      `${this.BASE_PATH}/bookings/${bookingId}/cancel`,
      { reason }
    );
    return response;
  }

  /**
   * Update booking details
   */
  async updateBooking(bookingId: string, updates: Partial<BookingRequest>) {
    const response = await httpClient.patch<BookingResponse>(
      `${this.BASE_PATH}/bookings/${bookingId}`,
      updates
    );
    return response;
  }
}

export const bookingService = new BookingService();