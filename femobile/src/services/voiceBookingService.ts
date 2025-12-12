/**
 * Voice Booking Service
 * Xử lý REST API cho chức năng đặt lịch bằng giọng nói
 * API Contract: /api-templates/21_11_2025/voice-booking.md
 */

import { Platform } from 'react-native';
import { httpClient } from './httpClient';
import {
  VoiceBookingResponse,
  VoiceBookingRequest,
  VoiceBookingStatusResponse,
  ConfirmVoiceBookingRequest,
  CancelVoiceBookingRequest,
} from '../types/voiceBooking';

// React Native file format (từ expo-av recording)
export interface ReactNativeFile {
  uri: string;
  type: string;
  name: string;
}

// Alias for backwards compatibility
interface RNFileObject extends ReactNativeFile {}

class VoiceBookingService {
  private readonly baseURL = '/customer/bookings/voice';

  /**
   * POST / - Tạo yêu cầu mới từ audio
   * @param audio - File audio (RN format: { uri, type, name }) hoặc Blob
   * @param hints - Gợi ý thêm cho parser (optional)
   */
  async createVoiceBooking(
    audio: RNFileObject | Blob | File,
    hints?: Record<string, any>
  ): Promise<VoiceBookingResponse> {
    const formData = new FormData();
    
    // React Native FormData cần format khác với web
    // Nếu là object { uri, type, name } thì append trực tiếp
    if (typeof (audio as RNFileObject).uri === 'string') {
      formData.append('audio', audio as any);
    } else {
      // Web Blob/File
      formData.append('audio', audio as any);
    }
    
    if (hints) {
      formData.append('hints', JSON.stringify(hints));
    }

    const response = await httpClient.postFormData<VoiceBookingResponse>(
      this.baseURL,
      formData,
      { timeout: 90000 } // 90s for STT + AI processing (increased for slow networks)
    );

    // Backend trả về VoiceBookingResponse trực tiếp (có success, message, requestId, status cùng cấp)
    // httpClient.normalizeSuccess sẽ giữ nguyên vì có 'success' field
    // Vậy response chính là VoiceBookingResponse, không có wrapper .data
    const voiceResponse = response as any;
    if (voiceResponse.requestId && voiceResponse.status) {
      // Response chính nó là VoiceBookingResponse
      return voiceResponse as VoiceBookingResponse;
    }

    // Hoặc có wrapper .data
    if (response.data && response.data.requestId) {
      return response.data;
    }

    // Nếu không có requestId thì throw error
    throw new Error(response.message || 'Không thể tạo yêu cầu đặt lịch bằng giọng nói');
  }

  /**
   * POST /continue - Bổ sung thông tin cho request PARTIAL / AWAITING_CONFIRMATION
   * @param requestId - ID của voice booking request
   * @param audio - File audio bổ sung (RN format: { uri, type, name }) hoặc Blob (optional)
   * @param additionalText - Text bổ sung (optional)
   * @param explicitFields - Map các field cụ thể đã điền (optional)
   */
  async continueVoiceBooking(
    requestId: string,
    options?: {
      audio?: RNFileObject | Blob | File;
      additionalText?: string;
      explicitFields?: Record<string, any>;
    }
  ): Promise<VoiceBookingResponse> {
    const formData = new FormData();
    formData.append('requestId', requestId);

    if (options?.audio) {
      // React Native FormData cần format khác với web
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
      { timeout: 90000 } // 90s for STT + AI processing (increased for slow networks)
    );

    // Backend trả về VoiceBookingResponse trực tiếp
    const voiceResponse = response as any;
    if (voiceResponse.requestId && voiceResponse.status) {
      return voiceResponse as VoiceBookingResponse;
    }

    // Hoặc có wrapper .data
    if (response.data && response.data.requestId) {
      return response.data;
    }

    throw new Error(response.message || 'Không thể tiếp tục yêu cầu đặt lịch');
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

    const voiceResponse = response as any;

    // Extract bookingId từ nhiều nguồn có thể
    const extractedBookingId = voiceResponse.bookingId 
      || response.data?.bookingId 
      || voiceResponse.booking?.id
      || (response.data as any)?.booking?.id;

    // Check nếu có status COMPLETED -> thành công
    if (voiceResponse.status === 'COMPLETED') {
      return {
        ...voiceResponse,
        bookingId: extractedBookingId,
      } as VoiceBookingResponse;
    }
    
    // Check nếu có bookingId -> thành công (đã tạo booking)
    if (extractedBookingId) {
      return {
        ...voiceResponse,
        status: 'COMPLETED',
        bookingId: extractedBookingId,
        isFinal: true,
      } as VoiceBookingResponse;
    }
    
    // Check trong response.data
    if (response.data?.status === 'COMPLETED') {
      return {
        ...response.data,
        bookingId: extractedBookingId || response.data.bookingId,
      };
    }

    // Nếu message chứa "success" hoặc "thành công" -> coi như thành công
    if (response.message?.toLowerCase().includes('success') || 
        response.message?.toLowerCase().includes('thành công') ||
        response.message?.toLowerCase().includes('created')) {
      return {
        success: true,
        message: response.message,
        requestId: requestId,
        status: 'COMPLETED',
        bookingId: extractedBookingId,
        isFinal: true,
      } as VoiceBookingResponse;
    }

    throw new Error(response.message || 'Không thể xác nhận đặt lịch');
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

    // Backend có thể trả về success:false nhưng status:CANCELLED là thành công
    // Hoặc trả về trực tiếp VoiceBookingResponse với status CANCELLED
    const voiceResponse = response as any;
    
    // Check nếu response có status CANCELLED -> đã cancel thành công
    if (voiceResponse.status === 'CANCELLED' || voiceResponse.requestId) {
      return voiceResponse as VoiceBookingResponse;
    }
    
    // Check trong response.data
    if (response.data?.status === 'CANCELLED' || response.data?.requestId) {
      return response.data;
    }

    // Nếu message chứa "huỷ" hoặc "cancel" -> coi như thành công
    if (response.message?.toLowerCase().includes('huỷ') || 
        response.message?.toLowerCase().includes('hủy') ||
        response.message?.toLowerCase().includes('cancel')) {
      return {
        success: true,
        message: response.message,
        requestId: requestId,
        status: 'CANCELLED',
        isFinal: true,
      } as VoiceBookingResponse;
    }

    throw new Error(response.message || 'Không thể hủy yêu cầu đặt lịch');
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

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể lấy thông tin yêu cầu đặt lịch');
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

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể kiểm tra trạng thái dịch vụ');
    }

    return response.data;
  }
}

export default new VoiceBookingService();
