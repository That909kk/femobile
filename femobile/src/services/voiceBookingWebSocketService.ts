/**
 * Voice Booking WebSocket Service
 * Xử lý real-time events cho chức năng đặt lịch bằng giọng nói
 * WebSocket endpoint: /ws/voice-booking
 * Topic: /topic/voice-booking/{requestId}
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '../constants';
import { VoiceBookingEventPayload } from '../types/voiceBooking';

type VoiceBookingEventCallback = (event: VoiceBookingEventPayload) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: any) => void;

class VoiceBookingWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private eventHandlers: Map<string, VoiceBookingEventCallback[]> = new Map();
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  private onConnectCallbacks: ConnectionCallback[] = [];
  private onDisconnectCallbacks: ConnectionCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  /**
   * Khởi tạo và kết nối WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isConnected || !this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout sau 5s
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(); // Resolve anyway, không reject
        }, 5000);
      });
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;

        // WebSocket endpoint: /ws/voice-booking
        const wsUrl = API_CONFIG.WEBSOCKET_URL + '/voice-booking';

        // Tạo SockJS socket
        const socket = new SockJS(wsUrl);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          reconnectDelay: 0,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
        });

        // Timeout 5 giây (giảm từ 10s)
        const timeoutId = setTimeout(() => {
          this.isConnecting = false;
          if (this.client) {
            this.client.deactivate();
          }
          // Resolve thay vì reject - WebSocket là optional
          resolve();
        }, 5000);

        // Xử lý kết nối thành công
        this.client.onConnect = (frame) => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          clearTimeout(timeoutId);
          this.onConnectCallbacks.forEach(callback => callback());
          resolve();
        };

        // Xử lý lỗi STOMP
        this.client.onStompError = (frame) => {
          console.error('[VoiceBookingWS] STOMP error', frame);
          clearTimeout(timeoutId);
          this.isConnecting = false;
          this.onErrorCallbacks.forEach(callback => callback(frame));
          if (this.client) {
            this.client.deactivate();
          }
          reject(new Error('WebSocket STOMP error'));
        };

        // Xử lý WebSocket error
        this.client.onWebSocketError = (event) => {
          console.error('[VoiceBookingWS] WebSocket error', event);
          clearTimeout(timeoutId);
          this.isConnecting = false;
          this.onErrorCallbacks.forEach(callback => callback(event));
          reject(new Error('WebSocket error'));
        };

        // Xử lý ngắt kết nối
        this.client.onDisconnect = () => {
          this.isConnected = false;
          this.subscriptions.clear();
          this.onDisconnectCallbacks.forEach(callback => callback());

          // Auto reconnect nếu chưa vượt quá số lần thử
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect().catch(() => {});
            }, this.reconnectDelay);
          }
        };

        // Kích hoạt client
        this.client.activate();
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe vào topic của một requestId cụ thể
   * Topic: /topic/voice-booking/{requestId}
   */
  subscribeToRequest(requestId: string, callback: VoiceBookingEventCallback): void {
    if (!this.isConnected || !this.client) {
      // Không tự động kết nối - WebSocket là optional
      return;
    }

    const topic = `/topic/voice-booking/${requestId}`;

    // Thêm callback vào map
    if (!this.eventHandlers.has(requestId)) {
      this.eventHandlers.set(requestId, []);
    }
    this.eventHandlers.get(requestId)!.push(callback);

    // Nếu đã subscribe rồi thì không subscribe lại
    if (this.subscriptions.has(requestId)) {
      return;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const event: VoiceBookingEventPayload = JSON.parse(message.body);

        // Gọi tất cả callbacks cho requestId này
        const handlers = this.eventHandlers.get(requestId) || [];
        handlers.forEach(handler => handler(event));
      } catch (error) {
        // Parse error - ignore
      }
    });

    this.subscriptions.set(requestId, subscription);
  }

  /**
   * Unsubscribe khỏi topic của một requestId
   */
  unsubscribeFromRequest(requestId: string): void {
    const subscription = this.subscriptions.get(requestId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(requestId);
      this.eventHandlers.delete(requestId);
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.eventHandlers.clear();
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Đăng ký callback khi connect thành công
   */
  onConnect(callback: ConnectionCallback): void {
    this.onConnectCallbacks.push(callback);
  }

  /**
   * Đăng ký callback khi disconnect
   */
  onDisconnect(callback: ConnectionCallback): void {
    this.onDisconnectCallbacks.push(callback);
  }

  /**
   * Đăng ký callback khi có lỗi
   */
  onError(callback: ErrorCallback): void {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default new VoiceBookingWebSocketService();
