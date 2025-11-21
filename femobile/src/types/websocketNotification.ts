/**
 * WebSocket Notification Types
 * Dựa theo API-WebSocket-Real-Time-Notifications.md
 */

/**
 * User Role Types - Role-based routing
 */
export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

/**
 * Notification Types - Loại thông báo
 */
export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_VERIFIED'
  | 'BOOKING_REJECTED'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_CANCELLED'
  | 'ASSIGNMENT_ASSIGNED'
  | 'ASSIGNMENT_COMPLETED'
  | 'ASSIGNMENT_CRISIS'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'PROMOTION_AVAILABLE'
  | 'SYSTEM'
  | 'OTHER';

/**
 * Priority Levels
 */
export type NotificationPriority = 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Related Entity Types
 */
export type RelatedType = 'BOOKING' | 'ASSIGNMENT' | 'PAYMENT' | 'REVIEW' | 'PROMOTION' | 'SYSTEM' | 'OTHER';

/**
 * WebSocket Notification DTO
 * Nhận từ WebSocket server
 */
export interface NotificationWebSocketDTO {
  notificationId: string;
  accountId: string;
  targetRole: UserRole; // Role this notification is intended for
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // bookingId, assignmentId, etc.
  relatedType?: RelatedType; // BOOKING, ASSIGNMENT, PAYMENT, etc.
  priority: NotificationPriority; // NORMAL, HIGH, URGENT
  actionUrl?: string; // Deep link to relevant page
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Extended Notification for local use
 */
export interface Notification extends NotificationWebSocketDTO {
  isRead: boolean;
  readAt?: string;
  receivedAt: string; // Timestamp khi nhận được qua WebSocket
}

/**
 * WebSocket Connection Status
 */
export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * WebSocket Subscription Info
 */
export interface WebSocketSubscription {
  accountId: string;
  role: UserRole;
  destination: string; // e.g., /user/{accountId}/{ROLE}/queue/notifications
}
