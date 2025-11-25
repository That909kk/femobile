/**
 * Voice Booking Types
 * API Contract: /api-templates/21_11_2025/voice-booking.md
 */

// Trạng thái của voice booking request
export type VoiceBookingStatus = 
  | 'PROCESSING'           // Đang xử lý audio
  | 'PARTIAL'              // Thiếu thông tin
  | 'AWAITING_CONFIRMATION' // Đang chờ xác nhận
  | 'COMPLETED'            // Đã hoàn thành
  | 'FAILED'               // Thất bại
  | 'CANCELLED';           // Đã hủy

// Event type từ WebSocket
export type VoiceBookingEventType =
  | 'RECEIVED'              // Đã nhận audio
  | 'TRANSCRIBING'          // Đang chuyển đổi giọng nói
  | 'PARTIAL'               // Thiếu thông tin
  | 'AWAITING_CONFIRMATION' // Chờ xác nhận
  | 'COMPLETED'             // Hoàn thành
  | 'FAILED'                // Thất bại
  | 'CANCELLED';            // Đã hủy

// Service trong preview
export interface VoiceBookingPreviewService {
  serviceId: number;
  serviceName: string | null;
  quantity: number;
  unitPrice: number;
  unitPriceFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  selectedChoiceIds?: number[] | null;
}

// Employee trong preview
export interface VoiceBookingPreviewEmployee {
  employeeId: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

// Preview booking data
export interface VoiceBookingPreview {
  addressId?: number | null;
  address?: string | null;
  fullAddress?: string | null; // Địa chỉ đầy đủ từ BE
  ward?: string | null;
  city?: string | null;
  bookingTime: string | null; // ISO datetime
  note?: string | null;
  promoCode?: string | null;
  paymentMethodId?: number | null;
  totalAmount: number;
  totalAmountFormatted?: string;
  formattedTotalAmount?: string; // BE có thể trả tên khác
  services: VoiceBookingPreviewService[];
  employees?: VoiceBookingPreviewEmployee[];
  autoAssignedEmployees?: boolean;
}

// TTS Speech data
export interface VoiceBookingSpeech {
  text: string;
  audioUrl: string;
  provider?: string;
  processingTimeMs?: number;
}

// Speech container (message và clarification)
export interface VoiceBookingSpeechContainer {
  message?: VoiceBookingSpeech;
  clarification?: VoiceBookingSpeech;
}

// Response từ REST API
export interface VoiceBookingResponse {
  success: boolean;
  message: string;
  status: VoiceBookingStatus;
  requestId: string;
  transcript?: string;
  confidenceScore?: number | null;
  processingTimeMs?: number | null;
  missingFields?: string[];
  clarificationMessage?: string | null;
  preview?: VoiceBookingPreview | null;
  bookingId?: string | null;
  extractedInfo?: Record<string, any> | null;
  speech?: VoiceBookingSpeechContainer | null;
  errorDetails?: string | null;
  failureHints?: string[] | null;
  retryAfterMs?: number | null;
  isFinal: boolean;
}

// WebSocket Event Payload
export interface VoiceBookingEventPayload {
  requestId: string;
  status: VoiceBookingStatus;
  event: VoiceBookingEventType;
  transcript?: string | null;
  processingTimeMs?: number | null;
  confidenceScore?: number | null;
  missingFields?: string[] | null;
  clarificationMessage?: string | null;
  preview?: VoiceBookingPreview | null;
  bookingId?: string | null;
  message: string;
  speech?: VoiceBookingSpeechContainer | null;
  hints?: string[] | null;
  aiPrompt?: string | null;
  errorDetails?: string | null;
}

// Request body cho POST /
export interface CreateVoiceBookingRequest {
  audio: File | Blob;
  hints?: string; // JSON string
}

// Request body cho POST /continue
export interface ContinueVoiceBookingRequest {
  requestId: string;
  audio?: File | Blob;
  additionalText?: string;
  explicitFields?: string; // JSON string
}

// Request body cho POST /confirm
export interface ConfirmVoiceBookingRequest {
  requestId: string;
}

// Request body cho POST /cancel
export interface CancelVoiceBookingRequest {
  requestId: string;
}

// Voice Booking Request entity (GET /{requestId})
export interface VoiceBookingRequest {
  id: string;
  customerId: number;
  status: VoiceBookingStatus;
  transcript: string | null;
  audioUrl?: string | null;
  confidenceScore?: number | null;
  processingTimeMs?: number | null;
  hints?: Record<string, any> | null;
  missingFields?: string[] | null;
  previewPayload?: VoiceBookingPreview | null;
  draftBookingRequest?: any | null;
  bookingId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

// Voice Booking Status Response
export interface VoiceBookingStatusResponse {
  enabled: boolean;
  [key: string]: any; // Metadata tùy cấu hình
}
