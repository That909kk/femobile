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
import voiceBookingService, { ReactNativeFile } from '../services/voiceBookingService';
import voiceBookingWebSocketService from '../services/voiceBookingWebSocketService';

// Type cho audio file trong React Native
type AudioFile = Blob | File | ReactNativeFile;

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
  cancelRecording: () => void;
  stopRecording: (audioFile: AudioFile, hints?: Record<string, any>) => Promise<void>;
  
  // Continue conversation
  continueWithAudio: (audioFile: AudioFile) => Promise<void>;
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
      console.log('[VoiceBookingStore] WebSocket connected successfully');
    } catch (error) {
      console.warn('[VoiceBookingStore] WebSocket connection failed (non-critical):', error);
      // Không set error vì WebSocket là optional, REST API vẫn hoạt động
      set({ isConnected: false });
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

  // Cancel recording without sending audio (e.g., user stopped before recording was ready)
  cancelRecording: () => {
    set({ isRecording: false });
  },

  stopRecording: async (audioFile: AudioFile, hints?: Record<string, any>) => {
    const state = get();
    
    try {
      set({ isRecording: false, isProcessing: true });

      // Gửi audio lên server
      const response = await voiceBookingService.createVoiceBooking(audioFile, hints);

      // Cập nhật state
      set({
        currentRequestId: response.requestId,
        currentStatus: response.status,
        transcript: response.transcript || null,
        isProcessing: false,
      });

      // Subscribe WebSocket để nhận real-time updates (nếu đã connected)
      if (response.requestId && state.isConnected) {
        try {
          voiceBookingWebSocketService.subscribeToRequest(
            response.requestId,
            (event: VoiceBookingEventPayload) => {
              get().handleWebSocketEvent(event);
            }
          );
          console.log('[VoiceBookingStore] Subscribed to WebSocket for request:', response.requestId);
        } catch (wsError) {
          console.warn('[VoiceBookingStore] WebSocket subscription failed (non-critical):', wsError);
          // Continue without WebSocket - REST API sẽ handle
        }
      } else if (response.requestId && !state.isConnected) {
        console.log('[VoiceBookingStore] WebSocket not connected, using REST API only');
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
  continueWithAudio: async (audioFile: AudioFile) => {
    const state = get();
    if (!state.currentRequestId) return;

    try {
      set({ isProcessing: true });

      const response = await voiceBookingService.continueVoiceBooking(
        state.currentRequestId,
        { audio: audioFile }
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
    if (!state.currentRequestId) {
      console.log('[VoiceBookingStore] No requestId to cancel');
      return;
    }

    try {
      set({ isProcessing: true });
      
      console.log('[VoiceBookingStore] Cancelling booking:', state.currentRequestId);

      await voiceBookingService.cancelVoiceBooking(state.currentRequestId);

      console.log('[VoiceBookingStore] Booking cancelled successfully');

      // Unsubscribe WebSocket
      voiceBookingWebSocketService.unsubscribeFromRequest(state.currentRequestId);

      set({ isProcessing: false, currentStatus: 'CANCELLED' });
      get().addAIMessage('Đã hủy yêu cầu đặt lịch.');
      
      // Reset sau 1 giây
      setTimeout(() => {
        get().resetConversation();
      }, 1000);

    } catch (error: any) {
      // Check if error message indicates successful cancellation
      const errorMsg = error.message || '';
      if (errorMsg.includes('huỷ') || errorMsg.includes('hủy') || errorMsg.includes('cancel')) {
        // This is actually a success - backend returned success message as error
        console.log('[VoiceBookingStore] Booking cancelled (message in error):', errorMsg);
        voiceBookingWebSocketService.unsubscribeFromRequest(state.currentRequestId);
        set({ isProcessing: false, currentStatus: 'CANCELLED' });
        get().addAIMessage('Đã hủy yêu cầu đặt lịch.');
        setTimeout(() => {
          get().resetConversation();
        }, 1000);
        return;
      }
      
      console.error('[VoiceBookingStore] Error cancelling booking:', error);
      set({
        isProcessing: false,
        error: errorMsg || 'Có lỗi xảy ra khi hủy đặt lịch.',
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
    console.log('[VoiceBookingStore] Adding AI message:', {
      content: content.substring(0, 50),
      hasAudioUrl: !!audioUrl,
      audioUrl,
      status,
    });
    
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

    console.log('[VoiceBookingStore] Handling response:', {
      status: response.status,
      hasTranscript: !!response.transcript,
      hasMessage: !!response.message,
      hasClarification: !!response.clarificationMessage,
      hasSpeech: !!response.speech,
      speechMessageUrl: response.speech?.message?.audioUrl,
      speechClarificationUrl: response.speech?.clarification?.audioUrl,
    });

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

        // Ưu tiên message audio trước, không có thì mới dùng clarification audio
        const partialAudioUrl = response.speech?.message?.audioUrl || response.speech?.clarification?.audioUrl;
        
        // Text tương ứng với audio đang chọn
        // Ưu tiên speech.text (đầy đủ) hơn response.message (có thể bị cắt)
        let partialText: string;
        if (response.speech?.message?.audioUrl) {
          // Đang dùng message audio -> ưu tiên speech.message.text
          partialText = response.speech?.message?.text || response.message || 'Đang xử lý yêu cầu...';
        } else {
          // Đang dùng clarification audio -> ưu tiên speech.clarification.text
          partialText = response.speech?.clarification?.text || response.clarificationMessage || response.message || 'Vui lòng cung cấp thêm thông tin.';
        }

        console.log('[VoiceBookingStore] PARTIAL - speech data:', {
          hasSpeech: !!response.speech,
          hasMessage: !!response.speech?.message,
          hasClarification: !!response.speech?.clarification,
          messageAudioUrl: response.speech?.message?.audioUrl,
          clarificationAudioUrl: response.speech?.clarification?.audioUrl,
          selectedAudioUrl: partialAudioUrl,
          audioUrlType: typeof partialAudioUrl,
          audioUrlValid: partialAudioUrl ? (partialAudioUrl.startsWith('http://') || partialAudioUrl.startsWith('https://')) : false,
          // Log full text để debug
          messageText: response.speech?.message?.text,
          clarificationText: response.speech?.clarification?.text,
          responseMessage: response.message,
          selectedText: partialText,
        });

        // Validate audio URL trước khi add message
        if (partialAudioUrl && !partialAudioUrl.startsWith('http://') && !partialAudioUrl.startsWith('https://')) {
          console.error('[VoiceBookingStore] Invalid audio URL from backend:', partialAudioUrl);
          // Vẫn add message nhưng không có audio
          get().addAIMessage(partialText, undefined, response.status);
        } else {
          // Thêm AI message với audio URL đã chọn
          get().addAIMessage(partialText, partialAudioUrl, response.status);
        }
        break;

      case 'AWAITING_CONFIRMATION':
        // Đã có preview, chờ xác nhận
        console.log('[VoiceBookingStore] AWAITING_CONFIRMATION - preview data:', {
          hasPreview: !!response.preview,
          preview: response.preview,
          address: response.preview?.address,
          bookingTime: response.preview?.bookingTime,
          services: response.preview?.services,
          totalAmount: response.preview?.totalAmount,
          totalAmountFormatted: response.preview?.totalAmountFormatted,
        });
        
        set({
          preview: response.preview || null,
          showPreview: true,
          showMissingFieldsForm: false,
        });

        // Ưu tiên message audio trước, không có thì mới dùng clarification audio
        const confirmAudioUrl = response.speech?.message?.audioUrl || response.speech?.clarification?.audioUrl;
        // Luôn dùng message tiếng Việt
        const confirmText = '✅ Đã dựng đơn nháp, vui lòng kiểm tra và xác nhận thông tin đặt lịch.';

        // Audio sẽ được phát bởi screen
        get().addAIMessage(confirmText, confirmAudioUrl, response.status);
        break;

      case 'COMPLETED':
        // Hoàn thành
        set({
          bookingId: response.bookingId || null,
          showPreview: false,
          showMissingFieldsForm: false,
        });

        // Ưu tiên message audio trước, không có thì mới dùng clarification audio
        const completedAudioUrl = response.speech?.message?.audioUrl || response.speech?.clarification?.audioUrl;
        
        // Luôn dùng message tiếng Việt cho COMPLETED, bỏ qua message tiếng Anh từ BE
        const defaultCompletedText = `🎉 Đặt lịch thành công! Mã đơn: ${response.bookingId}`;
        const completedText = defaultCompletedText;

        // Audio sẽ được phát bởi screen
        get().addAIMessage(completedText, completedAudioUrl, response.status);

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
