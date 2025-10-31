import { httpClient } from './httpClient';

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'ASSIGNMENT_ASSIGNED'
  | 'ASSIGNMENT_COMPLETED'
  | 'ASSIGNMENT_CRISIS'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'SYSTEM'
  | 'OTHER';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type RelatedType = 'BOOKING' | 'ASSIGNMENT' | 'PAYMENT' | 'SYSTEM' | 'OTHER';

export interface Notification {
  notificationId: string;
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: RelatedType;
  isRead: boolean;
  readAt?: string;
  priority: NotificationPriority;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: Notification;
}

class NotificationService {
  private readonly BASE_PATH = '/notifications';

  async getNotifications(params?: {
    page?: number;
    size?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
  }): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());
    if (typeof params?.unreadOnly === 'boolean')
      query.append('unreadOnly', params.unreadOnly.toString());
    if (params?.type) query.append('type', params.type);
    if (params?.priority) query.append('priority', params.priority);

    const endpoint = `${this.BASE_PATH}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await httpClient.get<NotificationListResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach thong bao');
    }

    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await httpClient.get<UnreadCountResponse>(
        `${this.BASE_PATH}/unread-count`,
      );

      if (!response.success) {
        console.warn('[NotificationService] getUnreadCount failed:', response.message);
        return 0; // Trả về 0 thay vì throw error
      }

      return response.data?.count || 0;
    } catch (error) {
      console.warn('[NotificationService] getUnreadCount error:', error);
      return 0; // Trả về 0 khi có lỗi
    }
  }

  async getNotificationById(notificationId: string): Promise<Notification> {
    const response = await httpClient.get<NotificationResponse>(
      `${this.BASE_PATH}/${notificationId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong tim thay thong bao');
    }

    return response.data.data!;
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const response = await httpClient.put<NotificationResponse>(
      `${this.BASE_PATH}/${notificationId}/read`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the danh dau da doc');
    }

    return true;
  }

  async markAllAsRead(): Promise<boolean> {
    const response = await httpClient.put<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/mark-all-read`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the danh dau tat ca da doc');
    }

    return true;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/${notificationId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the xoa thong bao');
    }

    return true;
  }
}

export const notificationService = new NotificationService();
