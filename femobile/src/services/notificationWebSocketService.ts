/**
 * WebSocket Notification Service
 * Xử lý real-time notifications qua WebSocket với role-based routing
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '../constants';
import type {
  NotificationWebSocketDTO,
  UserRole,
  WebSocketStatus,
  WebSocketSubscription,
} from '../types/websocketNotification';

type NotificationCallback = (notification: NotificationWebSocketDTO) => void;
type StatusCallback = (status: WebSocketStatus) => void;
type ErrorCallback = (error: any) => void;

class NotificationWebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private subscriptionInfo: WebSocketSubscription | null = null;
  private status: WebSocketStatus = 'disconnected';

  private notificationHandlers: NotificationCallback[] = [];
  private statusHandlers: StatusCallback[] = [];
  private errorHandlers: ErrorCallback[] = [];

  private isConnecting: boolean = false;
  private lastConnectionAttempt: number = 0;
  private connectionCooldown: number = 5000; // 5 seconds cooldown between attempts

  /**
   * Kết nối và subscribe notifications theo role
   */
  async connect(accountId: string, role: UserRole): Promise<void> {
    if (this.status === 'connected' && this.subscriptionInfo?.accountId === accountId && this.subscriptionInfo?.role === role) {
      return;
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.status === 'connected' || !this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    // Cooldown check - prevent rapid reconnection attempts
    const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
    if (timeSinceLastAttempt < this.connectionCooldown) {
      const remainingCooldown = Math.ceil((this.connectionCooldown - timeSinceLastAttempt) / 1000);
      throw new Error(`Please wait ${remainingCooldown} seconds before reconnecting`);
    }

    this.lastConnectionAttempt = Date.now();

    // Nếu đã connect với user/role khác, disconnect trước
    if (this.client && this.status === 'connected') {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        this.updateStatus('connecting');

        const wsUrl = API_CONFIG.WEBSOCKET_URL + '/notifications';

        // Tạo SockJS socket
        const socket = new SockJS(wsUrl);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          reconnectDelay: 0, // Disable auto-reconnect
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
        });

        // Xử lý kết nối thành công
        this.client.onConnect = (frame) => {
          this.isConnecting = false;
          this.lastConnectionAttempt = Date.now();
          this.updateStatus('connected');
          clearTimeout(timeoutId);

          // Subscribe to role-specific destination
          this.subscribeToNotifications(accountId, role);
          
          resolve();
        };

        // Xử lý lỗi STOMP
        this.client.onStompError = (frame) => {
          console.error('[NotificationWS] STOMP error', frame);
          clearTimeout(timeoutId);
          this.isConnecting = false;
          this.updateStatus('error');
          this.notifyError(frame);
          if (this.client) {
            this.client.deactivate();
          }
          reject(new Error('WebSocket STOMP error'));
        };

        // Xử lý mất kết nối
        this.client.onDisconnect = () => {
          this.isConnecting = false;
          this.updateStatus('disconnected');
          this.subscription = null;
          this.subscriptionInfo = null;
        };

        // Xử lý lỗi WebSocket
        this.client.onWebSocketError = (event) => {
          console.error('[NotificationWS] WebSocket error', event);
          clearTimeout(timeoutId);
          this.isConnecting = false;
          this.updateStatus('error');
          this.notifyError(event);
          if (this.client) {
            this.client.deactivate();
          }
          reject(new Error('WebSocket connection error'));
        };

        // Kích hoạt kết nối
        this.client.activate();

        // Timeout sau 10 giây
        const timeoutId = setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.updateStatus('error');
            if (this.client) {
              try {
                this.client.deactivate();
              } catch (e) {
                // Ignore deactivation error
              }
            }
            reject(new Error('Connection timeout - WebSocket server may not be available'));
          }
        }, 10000);
      } catch (error) {
        this.isConnecting = false;
        this.updateStatus('error');
        this.notifyError(error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to role-specific notification destination
   */
  private subscribeToNotifications(accountId: string, role: UserRole): void {
    if (!this.client || this.status !== 'connected') {
      return;
    }

    // Role-based routing destination
    const destination = `/user/${accountId}/${role}/queue/notifications`;

    try {
      this.subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const notification: NotificationWebSocketDTO = JSON.parse(message.body);
          
          // Verify targetRole matches
          if (notification.targetRole !== role) {
            return;
          }

          // Notify all handlers
          this.notificationHandlers.forEach(handler => {
            try {
              handler(notification);
            } catch (error) {
              // Handler error - ignore
            }
          });
        } catch (error) {
          this.notifyError(error);
        }
      });

      this.subscriptionInfo = {
        accountId,
        role,
        destination,
      };
    } catch (error) {
      this.notifyError(error);
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.subscription) {
      try {
        this.subscription.unsubscribe();
      } catch (error) {
        // Ignore unsubscribe error
      }
      this.subscription = null;
    }

    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        // Ignore deactivation error
      }
      this.client = null;
    }

    this.subscriptionInfo = null;
    this.updateStatus('disconnected');
  }

  /**
   * Đăng ký handler để nhận notifications
   */
  onNotification(handler: NotificationCallback): () => void {
    this.notificationHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Đăng ký handler để nhận status changes
   */
  onStatusChange(handler: StatusCallback): () => void {
    this.statusHandlers.push(handler);
    
    // Gọi ngay với status hiện tại
    handler(this.status);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Đăng ký handler để nhận errors
   */
  onError(handler: ErrorCallback): () => void {
    this.errorHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Lấy connection status hiện tại
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Lấy subscription info hiện tại
   */
  getSubscriptionInfo(): WebSocketSubscription | null {
    return this.subscriptionInfo;
  }

  /**
   * Kiểm tra đã connected chưa
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Update status và notify handlers
   */
  private updateStatus(newStatus: WebSocketStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusHandlers.forEach(handler => {
        try {
          handler(newStatus);
        } catch (error) {
          // Handler error - ignore
        }
      });
    }
  }

  /**
   * Notify error handlers
   */
  private notifyError(error: any): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        // Error handler error - ignore
      }
    });
  }
}

// Export singleton instance
export const notificationWebSocketService = new NotificationWebSocketService();
