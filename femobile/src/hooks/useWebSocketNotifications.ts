/**
 * Custom Hook for WebSocket Notifications
 * Quản lý connection và nhận real-time notifications theo role
 */

import { useEffect, useState, useCallback } from 'react';
import { notificationWebSocketService } from '../services/notificationWebSocketService';
import type {
  NotificationWebSocketDTO,
  UserRole,
  WebSocketStatus,
} from '../types/websocketNotification';

interface UseWebSocketNotificationsOptions {
  accountId: string | null;
  role: UserRole | null;
  autoConnect?: boolean; // Tự động kết nối khi có accountId và role
  onNotification?: (notification: NotificationWebSocketDTO) => void;
  onError?: (error: any) => void;
}

interface UseWebSocketNotificationsReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  retry: () => Promise<void>; // Manual retry function
  error: string | null;
}

/**
 * Hook để quản lý WebSocket notifications
 * 
 * @example
 * ```tsx
 * const { status, isConnected, connect, disconnect } = useWebSocketNotifications({
 *   accountId: user?.accountId,
 *   role: user?.currentRole,
 *   autoConnect: true,
 *   onNotification: (notification) => {
 *     // Xử lý notification
 *     notificationStore.addNotification(notification);
 *   }
 * });
 * ```
 */
export const useWebSocketNotifications = (
  options: UseWebSocketNotificationsOptions
): UseWebSocketNotificationsReturn => {
  const { accountId, role, autoConnect = true, onNotification, onError } = options;

  const [status, setStatus] = useState<WebSocketStatus>(notificationWebSocketService.getStatus());
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    if (!accountId || !role) {
      console.warn('[useWebSocketNotifications] Cannot connect - missing accountId or role');
      return;
    }

    // Don't retry if there's already an error
    if (status === 'error') {
      console.warn('[useWebSocketNotifications] Previous connection failed. Not retrying automatically.');
      return;
    }

    try {
      setError(null);
      await notificationWebSocketService.connect(accountId, role);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to connect to notification service';
      console.error('[useWebSocketNotifications] Connection error:', errorMsg);
      setError(errorMsg);
      if (onError) {
        onError(err);
      }
    }
  }, [accountId, role, status, onError]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    notificationWebSocketService.disconnect();
  }, []);

  /**
   * Manual retry connection (resets error state)
   */
  const retry = useCallback(async () => {
    setError(null);
    
    // Force disconnect first
    disconnect();
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to connect
    await connect();
  }, [connect, disconnect]);

  /**
   * Setup listeners
   */
  useEffect(() => {
    // Listen to status changes
    const unsubscribeStatus = notificationWebSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Listen to notifications
    let unsubscribeNotification: (() => void) | undefined;
    if (onNotification) {
      unsubscribeNotification = notificationWebSocketService.onNotification(onNotification);
    }

    // Listen to errors
    const unsubscribeError = notificationWebSocketService.onError((err) => {
      const errorMsg = err?.message || 'WebSocket error occurred';
      setError(errorMsg);
      if (onError) {
        onError(err);
      }
    });

    // Cleanup
    return () => {
      unsubscribeStatus();
      unsubscribeNotification?.();
      unsubscribeError();
    };
  }, [onNotification, onError]);

  /**
   * Auto-connect when accountId and role are available
   * Only connect once when status is disconnected
   */
  useEffect(() => {
    // Only auto-connect if:
    // 1. autoConnect is enabled
    // 2. Have both accountId and role
    // 3. Currently disconnected (not connecting, connected, or error)
    const shouldConnect = autoConnect && accountId && role && status === 'disconnected';
    
    if (shouldConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, accountId, role]); // Removed status, connect, disconnect from deps to prevent re-trigger

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    retry,
    error,
  };
};

/**
 * Hook đơn giản chỉ để lắng nghe notifications
 * Không quản lý connection
 * 
 * @example
 * ```tsx
 * useNotificationListener((notification) => {
 *   console.log('New notification:', notification);
 *   notificationStore.addNotification(notification);
 * });
 * ```
 */
export const useNotificationListener = (
  onNotification: (notification: NotificationWebSocketDTO) => void
): void => {
  useEffect(() => {
    const unsubscribe = notificationWebSocketService.onNotification(onNotification);
    return unsubscribe;
  }, [onNotification]);
};
