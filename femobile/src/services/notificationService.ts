import { httpClient } from './httpClient';

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

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type RelatedType = 'BOOKING' | 'ASSIGNMENT' | 'PAYMENT' | 'REVIEW' | 'PROMOTION' | 'SYSTEM' | 'OTHER';

export interface Notification {
  notificationId: string;
  accountId: string;
  targetRole?: string; // CUSTOMER, EMPLOYEE, ADMIN - for WebSocket notifications
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
  receivedAt?: string; // Timestamp khi nhận được qua WebSocket
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
    try {
      const query = new URLSearchParams();
      if (typeof params?.page === 'number') query.append('page', params.page.toString());
      if (typeof params?.size === 'number') query.append('size', params.size.toString());
      if (typeof params?.unreadOnly === 'boolean')
        query.append('unreadOnly', params.unreadOnly.toString());
      if (params?.type) query.append('type', params.type);
      if (params?.priority) query.append('priority', params.priority);

      const endpoint = `${this.BASE_PATH}${query.toString() ? `?${query.toString()}` : ''}`;
      console.log('[NotificationService] 📡 Calling endpoint:', endpoint);
      
      const response = await httpClient.get<any>(endpoint);
      console.log('[NotificationService] 📥 Raw response:', JSON.stringify(response).substring(0, 300));

      // API trả về: { success, data: [...], currentPage, totalItems, totalPages }
      if (!response.success) {
        console.error('[NotificationService] ❌ API returned success=false:', response.message);
        throw new Error(response.message || 'Khong the tai danh sach thong bao');
      }

      // Cast to correct type - backend returns pagination fields at top level
      const typedResponse = response as any;
      
      const result: NotificationListResponse = {
        success: typedResponse.success,
        data: typedResponse.data || [],
        currentPage: typedResponse.currentPage || 0,
        totalItems: typedResponse.totalItems || 0,
        totalPages: typedResponse.totalPages || 0,
      };
      
      console.log('[NotificationService] ✅ Parsed notifications:', result.data?.length || 0, 'items');
      return result;
    } catch (error: any) {
      console.error('[NotificationService] getNotifications failed:', error?.message);
      // Return empty data instead of throwing to prevent app crash
      return {
        success: false,
        data: [],
        currentPage: 0,
        totalItems: 0,
        totalPages: 0,
      } as NotificationListResponse;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      console.log('[NotificationService] 📡 Calling /unread-count...');
      const response = await httpClient.get<UnreadCountResponse>(
        `${this.BASE_PATH}/unread-count`,
      );

      console.log('[NotificationService] 📥 Unread count response:', JSON.stringify(response).substring(0, 200));

      if (!response.success) {
        console.warn('[NotificationService] ⚠️ getUnreadCount failed:', response.message);
        return 0;
      }

      // API response structure: { success: true, count: X }
      // But httpClient wraps it in ApiResponse: { success: true, data: { success: true, count: X } }
      const rawResponse = response as any;
      const count = rawResponse.count ?? rawResponse.data?.count ?? 0;
      console.log('[NotificationService] ✅ Unread count parsed:', count);
      return count;
    } catch (error: any) {
      console.warn('[NotificationService] ❌ getUnreadCount error:', error?.message);
      return 0;
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
