/**
 * Voice Booking Service
 * Xử lý REST API cho chức năng đặt lịch bằng giọng nói
 * API Contract: /api-templates/21_11_2025/voice-booking.md
 */

import { httpClient } from './httpClient';
import {
  VoiceBookingResponse,
  VoiceBookingRequest,
  VoiceBookingStatusResponse,
  ConfirmVoiceBookingRequest,
  CancelVoiceBookingRequest,
} from '../types/voiceBooking';

class VoiceBookingService {
  private readonly baseURL = '/customer/bookings/voice';

  /**
   * POST / - Tạo yêu cầu mới từ audio
   * @param audio - File audio cần nhận diện
   * @param hints - Gợi ý thêm cho parser (optional)
   */
  async createVoiceBooking(
    audio: Blob | File,
    hints?: Record<string, any>
  ): Promise<VoiceBookingResponse> {
    const formData = new FormData();
    formData.append('audio', audio as any);
    
    if (hints) {
      formData.append('hints', JSON.stringify(hints));
    }

    const response = await httpClient.postFormData<VoiceBookingResponse>(
      this.baseURL,
      formData,
      { timeout: 60000 } // 60s for STT + AI processing
    );

    if (!response.data) {
      throw new Error('No data returned from server');
    }

    return response.data;
  }

  /**
   * POST /continue - Bổ sung thông tin cho request PARTIAL / AWAITING_CONFIRMATION
   * @param requestId - ID của voice booking request
   * @param audio - File audio bổ sung (optional)
   * @param additionalText - Text bổ sung (optional)
   * @param explicitFields - Map các field cụ thể đã điền (optional)
   */
  async continueVoiceBooking(
    requestId: string,
    options?: {
      audio?: Blob | File;
      additionalText?: string;
      explicitFields?: Record<string, any>;
    }
  ): Promise<VoiceBookingResponse> {
    const formData = new FormData();
    formData.append('requestId', requestId);

    if (options?.audio) {
      formData.append('audio', options.audio as any);
    }

    if (options?.additionalText) {
      formData.append('additionalText', options.additionalText);
    }

    if (options?.explicitFields) {
      formData.append('explicitFields', JSON.stringify(options.explicitFields));
    }

    const response = await httpClient.postFormData<VoiceBookingResponse>(
      `${this.baseURL}/continue`,
      formData,
      { timeout: 60000 } // 60s for STT + AI processing
    );

    if (!response.data) {
      throw new Error('No data returned from server');
    }

    return response.data;
  }

  /**
   * POST /confirm - Xác nhận draft
   * @param requestId - ID của voice booking request
   */
  async confirmVoiceBooking(
    requestId: string
  ): Promise<VoiceBookingResponse> {
    const payload: ConfirmVoiceBookingRequest = { requestId };

    const response = await httpClient.post<VoiceBookingResponse>(
      `${this.baseURL}/confirm`,
      payload
    );

    if (!response.data) {
      throw new Error('No data returned from server');
    }

    return response.data;
  }

  /**
   * POST /cancel - Hủy draft/partial
   * @param requestId - ID của voice booking request
   */
  async cancelVoiceBooking(
    requestId: string
  ): Promise<VoiceBookingResponse> {
    const payload: CancelVoiceBookingRequest = { requestId };

    const response = await httpClient.post<VoiceBookingResponse>(
      `${this.baseURL}/cancel`,
      payload
    );

    if (!response.data) {
      throw new Error('No data returned from server');
    }

    return response.data;
  }

  /**
   * GET /{requestId} - Lấy chi tiết voice booking
   * @param requestId - ID của voice booking request
   */
  async getVoiceBookingDetails(
    requestId: string
  ): Promise<VoiceBookingRequest> {
    const response = await httpClient.get<VoiceBookingRequest>(
      `${this.baseURL}/${requestId}`
    );

    if (!response.data) {
      throw new Error('No data returned from server');
    }

    return response.data;
  }

  /**
   * GET /status - Kiểm tra dịch vụ voice booking
   */
  async getVoiceBookingStatus(): Promise<VoiceBookingStatusResponse> {
    const response = await httpClient.get<VoiceBookingStatusResponse>(
      `${this.baseURL}/status`
    );

    if (!response.data) {
      throw new Error('No data returned from server');
    }

    return response.data;
  }
}

export default new VoiceBookingService();
