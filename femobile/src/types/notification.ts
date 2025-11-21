// Notification related types

export interface Notification {
  notificationId: string;
  userId: string;
  userType: 'CUSTOMER' | 'EMPLOYEE';
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export type NotificationType =
  // Customer notifications
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_ASSIGNED'
  | 'BOOKING_IN_PROGRESS'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PROMOTION_AVAILABLE'
  | 'REVIEW_REQUEST'
  // Employee notifications
  | 'NEW_JOB_AVAILABLE'
  | 'JOB_ASSIGNED'
  | 'JOB_CANCELLED'
  | 'SCHEDULE_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'RATING_RECEIVED'
  // Chat notifications
  | 'NEW_MESSAGE'
  // General notifications
  | 'SYSTEM_UPDATE'
  | 'OTHER';

export interface NotificationList {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface NotificationPreferences {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  notificationTypes: {
    [key in NotificationType]?: boolean;
  };
}

// WebSocket notification payload
export interface WebSocketNotification {
  type: 'NOTIFICATION';
  action: 'NEW' | 'READ' | 'DELETE';
  data: Notification;
  timestamp: string;
}
