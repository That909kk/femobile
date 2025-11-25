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
      console.log('[VoiceBookingWS] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[VoiceBookingWS] Already connecting, waiting...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isConnected || !this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;

        // WebSocket endpoint: /ws/voice-booking
        const wsUrl = API_CONFIG.WEBSOCKET_URL + '/voice-booking';

        console.log('[VoiceBookingWS] ===== CONNECTING =====');
        console.log('[VoiceBookingWS] WS_BASE_URL:', API_CONFIG.WEBSOCKET_URL);
        console.log('[VoiceBookingWS] Full WebSocket URL:', wsUrl);
        console.log('[VoiceBookingWS] =====================');

        // Tạo SockJS socket
        const socket = new SockJS(wsUrl);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          debug: (str) => {
            console.log('[VoiceBookingWS Debug]', str);
          },
          reconnectDelay: 0,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
        });

        // Timeout 10 giây
        const timeoutId = setTimeout(() => {
          console.error('[VoiceBookingWS] Connection timeout');
          this.isConnecting = false;
          if (this.client) {
            this.client.deactivate();
          }
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        // Xử lý kết nối thành công
        this.client.onConnect = (frame) => {
          console.log('[VoiceBookingWS] Connected successfully', frame);
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
          console.log('[VoiceBookingWS] Disconnected');
          this.isConnected = false;
          this.subscriptions.clear();
          this.onDisconnectCallbacks.forEach(callback => callback());

          // Auto reconnect nếu chưa vượt quá số lần thử
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[VoiceBookingWS] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect().catch(console.error);
            }, this.reconnectDelay);
          }
        };

        // Kích hoạt client
        this.client.activate();
      } catch (error) {
        this.isConnecting = false;
        console.error('[VoiceBookingWS] Connection error:', error);
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
      console.warn('[VoiceBookingWS] Not connected, cannot subscribe');
      // Tự động kết nối và subscribe
      this.connect().then(() => {
        this.subscribeToRequest(requestId, callback);
      }).catch(console.error);
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
      console.log('[VoiceBookingWS] Already subscribed to', topic);
      return;
    }

    console.log('[VoiceBookingWS] Subscribing to', topic);

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const event: VoiceBookingEventPayload = JSON.parse(message.body);
        console.log('[VoiceBookingWS] Received event from', topic, event);

        // Gọi tất cả callbacks cho requestId này
        const handlers = this.eventHandlers.get(requestId) || [];
        handlers.forEach(handler => handler(event));
      } catch (error) {
        console.error('[VoiceBookingWS] Error parsing message:', error);
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
      console.log('[VoiceBookingWS] Unsubscribing from', requestId);
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
      console.log('[VoiceBookingWS] Disconnecting...');
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
