import { create } from 'zustand';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  notificationService,
} from '../services/notificationService';
import type { NotificationWebSocketDTO } from '../types/websocketNotification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

interface NotificationActions {
  fetchNotifications: (params?: {
    page?: number;
    size?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
  }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  addWebSocketNotification: (wsNotification: NotificationWebSocketDTO) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  currentPage: 0,
  totalPages: 0,
  hasMore: true,

  // Fetch notifications
  fetchNotifications: async (params = {}) => {
    try {
      console.log('[NotificationStore] 🔄 Fetching notifications with params:', params);
      set({ loading: true, error: null });
      const response = await notificationService.getNotifications(params);
      
      console.log('[NotificationStore] 📦 Received response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems
      });
      
      if (response.success && response.data) {
        const isFirstPage = !params.page || params.page === 0;
        const newNotifications = isFirstPage ? response.data : [
          ...get().notifications,
          ...response.data,
        ];
        
        console.log('[NotificationStore] 💾 Saving to store:', newNotifications.length, 'notifications');
        
        set({
          notifications: newNotifications,
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          hasMore: response.currentPage < response.totalPages - 1,
          loading: false,
        });
        
        console.log('[NotificationStore] ✅ Store updated successfully');
      } else {
        // API returned but no success
        console.warn('[NotificationStore] ⚠️ API returned unsuccessful response:', response);
        set({ loading: false });
      }
    } catch (error: any) {
      // Gracefully handle error - don't throw
      console.error('[NotificationStore] ❌ fetchNotifications error:', error.message);
      set({ 
        error: error.message || 'Không thể tải thông báo', 
        loading: false 
      });
      // Don't throw - let app continue with WebSocket notifications
    }
  },

  // Mark as read
  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      set(state => ({
        notifications: state.notifications.map(notif =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể đánh dấu đã đọc' });
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      
      set(state => ({
        notifications: state.notifications.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể đánh dấu tất cả đã đọc' });
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      set(state => {
        const deletedNotif = state.notifications.find(n => n.notificationId === notificationId);
        return {
          notifications: state.notifications.filter(n => n.notificationId !== notificationId),
          unreadCount: deletedNotif && !deletedNotif.isRead 
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Không thể xóa thông báo' });
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      console.log('[NotificationStore] 🔔 Fetching unread count...');
      const count = await notificationService.getUnreadCount();
      console.log('[NotificationStore] 🔔 Unread count received:', count);
      set({ unreadCount: count });
    } catch (error: any) {
      // Silent fail for unread count
      console.error('[NotificationStore] ❌ Failed to get unread count:', error);
    }
  },

  // Add notification (for real-time updates)
  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  // Add WebSocket notification (convert DTO to Notification)
  addWebSocketNotification: (wsNotification: NotificationWebSocketDTO) => {
    // Convert WebSocket DTO to local Notification format
    const notification: Notification = {
      ...wsNotification,
      isRead: false, // WebSocket notifications are always unread initially
      receivedAt: new Date().toISOString(),
    };

    console.log('[NotificationStore] Adding WebSocket notification:', notification);

    set(state => {
      // Check if notification already exists (prevent duplicates)
      const exists = state.notifications.some(
        n => n.notificationId === notification.notificationId
      );

      if (exists) {
        console.warn('[NotificationStore] Notification already exists, skipping:', notification.notificationId);
        return state;
      }

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  // Clear notifications
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      error: null,
    });
  },
}));
