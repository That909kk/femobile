/**
 * Voice Booking Store
 * Quản lý state cho chức năng đặt lịch bằng giọng nói
 */

import { create } from 'zustand';
import {
  VoiceBookingResponse,
  VoiceBookingEventPayload,
  VoiceBookingStatus,
  VoiceBookingPreview,
} from '../types/voiceBooking';
import voiceBookingService from '../services/voiceBookingService';
import voiceBookingWebSocketService from '../services/voiceBookingWebSocketService';

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  status?: VoiceBookingStatus;
}

interface VoiceBookingState {
  // Connection
  isConnected: boolean;
  
  // Recording
  isRecording: boolean;
  isProcessing: boolean;
  
  // Current request
  currentRequestId: string | null;
  currentStatus: VoiceBookingStatus | null;
  
  // Conversation
  messages: ConversationMessage[];
  
  // Data
  transcript: string | null;
  missingFields: string[];
  preview: VoiceBookingPreview | null;
  bookingId: string | null;
  
  // UI
  showPreview: boolean;
  showMissingFieldsForm: boolean;
  
  // Error
  error: string | null;
  
  // Audio playback
  currentPlayingAudio: string | null;
  isPlayingAudio: boolean;
}

interface VoiceBookingActions {
  // WebSocket
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  
  // Recording
  startRecording: () => void;
  stopRecording: (audioBlob: Blob, hints?: Record<string, any>) => Promise<void>;
  
  // Continue conversation
  continueWithAudio: (audioBlob: Blob) => Promise<void>;
  continueWithText: (text: string, explicitFields?: Record<string, any>) => Promise<void>;
  
  // Actions
  confirmBooking: () => Promise<void>;
  cancelBooking: () => Promise<void>;
  
  // Messages
  addUserMessage: (content: string, audioUrl?: string) => void;
  addAIMessage: (content: string, audioUrl?: string, status?: VoiceBookingStatus) => void;
  
  // Audio playback
  playAudio: (audioUrl: string) => void;
  stopAudio: () => void;
  
  // Reset
  resetConversation: () => void;
  clearError: () => void;
  
  // Internal handlers
  handleVoiceBookingResponse: (response: VoiceBookingResponse) => void;
  handleWebSocketEvent: (event: VoiceBookingEventPayload) => void;
}

const initialState: VoiceBookingState = {
  isConnected: false,
  isRecording: false,
  isProcessing: false,
  currentRequestId: null,
  currentStatus: null,
  messages: [],
  transcript: null,
  missingFields: [],
  preview: null,
  bookingId: null,
  showPreview: false,
  showMissingFieldsForm: false,
  error: null,
  currentPlayingAudio: null,
  isPlayingAudio: false,
};

export const useVoiceBookingStore = create<VoiceBookingState & VoiceBookingActions>((set, get) => ({
  ...initialState,

  // ===== WebSocket =====
  connectWebSocket: async () => {
    try {
      await voiceBookingWebSocketService.connect();
      set({ isConnected: true });
    } catch (error) {
      console.error('[VoiceBookingStore] WebSocket connection failed:', error);
      set({ error: 'Không thể kết nối đến server. Vui lòng thử lại.' });
    }
  },

  disconnectWebSocket: () => {
    voiceBookingWebSocketService.disconnect();
    set({ isConnected: false });
  },

  // ===== Recording =====
  startRecording: () => {
    set({ isRecording: true, error: null });
  },

  stopRecording: async (audioBlob: Blob, hints?: Record<string, any>) => {
    const state = get();
    
    try {
      set({ isRecording: false, isProcessing: true });

      // Gửi audio lên server (audioBlob here is actually the blob-like object from fetch)
      const response = await voiceBookingService.createVoiceBooking(audioBlob, hints);

      // Cập nhật state
      set({
        currentRequestId: response.requestId,
        currentStatus: response.status,
        transcript: response.transcript || null,
        isProcessing: false,
      });

      // Subscribe WebSocket để nhận real-time updates
      if (response.requestId) {
        voiceBookingWebSocketService.subscribeToRequest(
          response.requestId,
          (event: VoiceBookingEventPayload) => {
            get().handleWebSocketEvent(event);
          }
        );
      }

      // Xử lý response
      get().handleVoiceBookingResponse(response);

    } catch (error: any) {
      console.error('[VoiceBookingStore] Error creating voice booking:', error);
      set({
        isProcessing: false,
        error: error.message || 'Có lỗi xảy ra khi xử lý giọng nói. Vui lòng thử lại.',
      });
      
      get().addAIMessage('Xin lỗi, tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại.');
    }
  },

  // ===== Continue =====
  continueWithAudio: async (audioBlob: Blob) => {
    const state = get();
    if (!state.currentRequestId) return;

    try {
      set({ isProcessing: true });

      const response = await voiceBookingService.continueVoiceBooking(
        state.currentRequestId,
        { audio: audioBlob }
      );

      set({ isProcessing: false });
      get().handleVoiceBookingResponse(response);

    } catch (error: any) {
      console.error('[VoiceBookingStore] Error continuing with audio:', error);
      set({
        isProcessing: false,
        error: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
    }
  },

  continueWithText: async (text: string, explicitFields?: Record<string, any>) => {
    const state = get();
    if (!state.currentRequestId) return;

    try {
      set({ isProcessing: true });

      // Thêm user message
      get().addUserMessage(text);

      const response = await voiceBookingService.continueVoiceBooking(
        state.currentRequestId,
        { additionalText: text, explicitFields }
      );

      set({ isProcessing: false });
      get().handleVoiceBookingResponse(response);

    } catch (error: any) {
      console.error('[VoiceBookingStore] Error continuing with text:', error);
      set({
        isProcessing: false,
        error: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
    }
  },

  // ===== Actions =====
  confirmBooking: async () => {
    const state = get();
    if (!state.currentRequestId) return;

    try {
      set({ isProcessing: true });

      const response = await voiceBookingService.confirmVoiceBooking(state.currentRequestId);

      set({ isProcessing: false });
      get().handleVoiceBookingResponse(response);

    } catch (error: any) {
      console.error('[VoiceBookingStore] Error confirming booking:', error);
      set({
        isProcessing: false,
        error: error.message || 'Có lỗi xảy ra khi xác nhận đặt lịch.',
      });
    }
  },

  cancelBooking: async () => {
    const state = get();
    if (!state.currentRequestId) return;

    try {
      set({ isProcessing: true });

      await voiceBookingService.cancelVoiceBooking(state.currentRequestId);

      // Unsubscribe WebSocket
      voiceBookingWebSocketService.unsubscribeFromRequest(state.currentRequestId);

      set({ isProcessing: false });
      get().addAIMessage('Đã hủy yêu cầu đặt lịch.');
      
      // Reset sau 1 giây
      setTimeout(() => {
        get().resetConversation();
      }, 1000);

    } catch (error: any) {
      console.error('[VoiceBookingStore] Error cancelling booking:', error);
      set({
        isProcessing: false,
        error: error.message || 'Có lỗi xảy ra khi hủy đặt lịch.',
      });
    }
  },

  // ===== Messages =====
  addUserMessage: (content: string, audioUrl?: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      audioUrl,
      timestamp: new Date(),
    };
    set(state => ({ messages: [...state.messages, message] }));
  },

  addAIMessage: (content: string, audioUrl?: string, status?: VoiceBookingStatus) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      audioUrl,
      timestamp: new Date(),
      status,
    };
    set(state => ({ messages: [...state.messages, message] }));
  },

  // ===== Audio playback =====
  playAudio: (audioUrl: string) => {
    set({ currentPlayingAudio: audioUrl, isPlayingAudio: true });
  },

  stopAudio: () => {
    set({ currentPlayingAudio: null, isPlayingAudio: false });
  },

  // ===== Reset =====
  resetConversation: () => {
    const state = get();
    if (state.currentRequestId) {
      voiceBookingWebSocketService.unsubscribeFromRequest(state.currentRequestId);
    }
    set({ ...initialState, isConnected: state.isConnected });
  },

  clearError: () => {
    set({ error: null });
  },

  // ===== Internal handlers =====
  handleVoiceBookingResponse: (response: VoiceBookingResponse) => {
    const state = get();

    // Cập nhật transcript
    if (response.transcript) {
      set({ transcript: response.transcript });
    }

    // Cập nhật status
    set({ currentStatus: response.status });

    // Xử lý theo status
    switch (response.status) {
      case 'PROCESSING':
        get().addAIMessage('Đang xử lý yêu cầu của bạn...');
        break;

      case 'PARTIAL':
        // Thiếu thông tin
        set({
          missingFields: response.missingFields || [],
          showMissingFieldsForm: true,
        });

        // Hiển thị clarification message
        if (response.clarificationMessage) {
          get().addAIMessage(
            response.clarificationMessage,
            response.speech?.clarification?.audioUrl,
            response.status
          );
        } else if (response.message) {
          get().addAIMessage(response.message, response.speech?.message?.audioUrl, response.status);
        }

        // Auto play audio nếu có
        if (response.speech?.message?.audioUrl) {
          get().playAudio(response.speech.message.audioUrl);
        } else if (response.speech?.clarification?.audioUrl) {
          get().playAudio(response.speech.clarification.audioUrl);
        }
        break;

      case 'AWAITING_CONFIRMATION':
        // Đã có preview, chờ xác nhận
        set({
          preview: response.preview || null,
          showPreview: true,
          showMissingFieldsForm: false,
        });

        get().addAIMessage(
          response.message || 'Vui lòng xác nhận thông tin đặt lịch.',
          response.speech?.message?.audioUrl,
          response.status
        );

        // Auto play audio
        if (response.speech?.message?.audioUrl) {
          get().playAudio(response.speech.message.audioUrl);
        }
        break;

      case 'COMPLETED':
        // Hoàn thành
        set({
          bookingId: response.bookingId || null,
          showPreview: false,
          showMissingFieldsForm: false,
        });

        get().addAIMessage(
          `Đặt lịch thành công! Mã đơn: ${response.bookingId}`,
          response.speech?.message?.audioUrl,
          response.status
        );

        // Auto play audio
        if (response.speech?.message?.audioUrl) {
          get().playAudio(response.speech.message.audioUrl);
        }

        // Unsubscribe WebSocket
        if (state.currentRequestId) {
          voiceBookingWebSocketService.unsubscribeFromRequest(state.currentRequestId);
        }
        break;

      case 'FAILED':
        // Thất bại
        get().addAIMessage(
          response.errorDetails || 'Có lỗi xảy ra. Vui lòng thử lại.',
          undefined,
          response.status
        );
        set({ error: response.errorDetails || null });
        break;

      case 'CANCELLED':
        get().addAIMessage('Đã hủy yêu cầu đặt lịch.', undefined, response.status);
        break;
    }
  },

  handleWebSocketEvent: (event: VoiceBookingEventPayload) => {
    console.log('[VoiceBookingStore] WebSocket event:', event);

    // Cập nhật status
    set({ currentStatus: event.status });

    // Xử lý theo event type
    switch (event.event) {
      case 'RECEIVED':
        get().addAIMessage('Đã nhận được yêu cầu của bạn...');
        break;

      case 'TRANSCRIBING':
        get().addAIMessage('Đang chuyển đổi giọng nói...');
        break;

      case 'PARTIAL':
      case 'AWAITING_CONFIRMATION':
      case 'COMPLETED':
      case 'FAILED':
      case 'CANCELLED':
        // Sử dụng lại logic xử lý response
        get().handleVoiceBookingResponse({
          success: event.status === 'COMPLETED',
          message: event.message,
          status: event.status,
          requestId: event.requestId,
          transcript: event.transcript || undefined,
          confidenceScore: event.confidenceScore || undefined,
          processingTimeMs: event.processingTimeMs || undefined,
          missingFields: event.missingFields || undefined,
          clarificationMessage: event.clarificationMessage || undefined,
          preview: event.preview || undefined,
          bookingId: event.bookingId || undefined,
          speech: event.speech || undefined,
          errorDetails: event.errorDetails || undefined,
          isFinal: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(event.status),
        });
        break;
    }
  },
}));
