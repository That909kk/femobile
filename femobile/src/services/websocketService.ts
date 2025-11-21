/**
 * WebSocket Service for Real-time Chat
 * Sử dụng SockJS và STOMP protocol để kết nối với backend
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '../constants';
import * as SecureStore from 'expo-secure-store';
import { httpClient } from './httpClient';
import { ChatMessage } from './chatService'; // Use unified ChatMessage type

type MessageCallback = (message: ChatMessage) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Map<string, MessageCallback[]> = new Map();
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds

  private onConnectCallbacks: ConnectionCallback[] = [];
  private onDisconnectCallbacks: ConnectionCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  /**
   * Khởi tạo và kết nối WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[WebSocket] Already connecting, waiting...');
      // Đợi kết nối hiện tại hoàn thành
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
        
        // SockJS endpoint: /ws/chat
        const wsUrl = API_CONFIG.WEBSOCKET_URL + '/chat';
        
        console.log('[WebSocket] ===== CONNECTING =====');
        console.log('[WebSocket] WS_BASE_URL:', API_CONFIG.WEBSOCKET_URL);
        console.log('[WebSocket] Full WebSocket URL:', wsUrl);
        console.log('[WebSocket] =====================');

        // Tạo SockJS socket - giống y hệt web app
        const socket = new SockJS(wsUrl);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          debug: (str) => {
            console.log('[WebSocket Debug]', str);
          },
          reconnectDelay: 0, // Disable auto-reconnect
          heartbeatIncoming: 10000, // 10 seconds (giống web)
          heartbeatOutgoing: 10000, // 10 seconds (giống web)
        });

        // Xử lý kết nối thành công
        this.client.onConnect = (frame) => {
          console.log('[WebSocket] Connected successfully', frame);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          clearTimeout(timeoutId);
          this.onConnectCallbacks.forEach(callback => callback());
          resolve();
        };

        // Xử lý lỗi STOMP
        this.client.onStompError = (frame) => {
          console.error('[WebSocket] STOMP error', frame);
          clearTimeout(timeoutId);
          this.isConnecting = false;
          this.onErrorCallbacks.forEach(callback => callback(frame));
          if (this.client) {
            this.client.deactivate();
          }
          reject(new Error('WebSocket STOMP error'));
        };

        // Xử lý mất kết nối - KHÔNG tự reconnect
        this.client.onDisconnect = () => {
          console.log('[WebSocket] Disconnected');
          this.isConnected = false;
          this.isConnecting = false;
          this.onDisconnectCallbacks.forEach(callback => callback());
        };

        // Xử lý lỗi WebSocket
        this.client.onWebSocketError = (event) => {
          console.error('[WebSocket] WebSocket error', event);
          clearTimeout(timeoutId);
          this.isConnecting = false;
          this.onErrorCallbacks.forEach(callback => callback(event));
          if (this.client) {
            this.client.deactivate();
          }
          reject(new Error('WebSocket connection error'));
        };

        // Kích hoạt kết nối (giống web)
        this.client.activate();
        
        // Timeout sau 10 giây nếu không connect được
        const timeoutId = setTimeout(() => {
          if (this.isConnecting) {
            console.error('[WebSocket] Connection timeout after 10 seconds');
            console.error('[WebSocket] Possible causes:');
            console.error('[WebSocket] - Backend WebSocket server not running at:', wsUrl);
            console.error('[WebSocket] - Network connectivity issues');
            console.error('[WebSocket] - CORS or firewall blocking WebSocket');
            console.error('[WebSocket] - SockJS handshake failed');
            this.isConnecting = false;
            if (this.client) {
              try {
                this.client.deactivate();
              } catch (e) {
                console.error('[WebSocket] Error deactivating client:', e);
              }
            }
            reject(new Error('Connection timeout - WebSocket server may not be available'));
          }
        }, 10000);
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        this.isConnecting = false;
        this.onErrorCallbacks.forEach(callback => callback(error));
        reject(error);
      }
    });
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.client) {
      console.log('[WebSocket] Disconnecting...');
      this.subscriptions.clear();
      this.messageHandlers.clear();
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to conversation để nhận tin nhắn real-time
   */
  subscribeToConversation(
    conversationId: string,
    onMessage: MessageCallback
  ): () => void {
    console.log('[WebSocket] ===== SUBSCRIBE REQUEST =====');
    console.log('[WebSocket] Conversation ID:', conversationId);
    console.log('[WebSocket] isConnected:', this.isConnected);
    console.log('[WebSocket] client exists:', !!this.client);
    console.log('[WebSocket] =========================');
    
    if (!this.isConnected || !this.client) {
      console.warn('[WebSocket] Not connected. Call connect() first.');
      return () => {};
    }

    const topic = `/topic/conversation/${conversationId}`;
    
    // Thêm message handler
    if (!this.messageHandlers.has(conversationId)) {
      console.log('[WebSocket] Creating new handler array for conversation:', conversationId);
      this.messageHandlers.set(conversationId, []);
    }
    console.log('[WebSocket] Adding message handler');
    this.messageHandlers.get(conversationId)!.push(onMessage);
    console.log('[WebSocket] Total handlers for this conversation:', this.messageHandlers.get(conversationId)?.length);

    // Nếu chưa subscribe topic này
    if (!this.subscriptions.has(conversationId)) {
      console.log('[WebSocket] ===== SUBSCRIBING TO TOPIC =====');
      console.log('[WebSocket] Topic:', topic);
      
      try {
        const subscription = this.client.subscribe(topic, (message: IMessage) => {
          console.log('[WebSocket] ===== MESSAGE RECEIVED FROM STOMP =====');
          console.log('[WebSocket] Raw message body:', message.body);
          
          try {
            const chatMessage: ChatMessage = JSON.parse(message.body);
            console.log('[WebSocket] Parsed message:', {
              messageId: chatMessage.messageId,
              content: chatMessage.content || '[Image]',
              senderId: chatMessage.senderId,
              senderName: chatMessage.senderName,
              messageType: chatMessage.messageType,
            });
            
            // Normalize message: ensure it has createdAt
            const normalizedMessage: ChatMessage = {
              ...chatMessage,
              createdAt: chatMessage.createdAt || chatMessage.timestamp || new Date().toISOString(),
              timestamp: chatMessage.timestamp || chatMessage.createdAt || new Date().toISOString(),
            };
            
            // Gọi tất cả handlers cho conversation này
            const handlers = this.messageHandlers.get(conversationId) || [];
            console.log('[WebSocket] Calling', handlers.length, 'handler(s)');
            handlers.forEach((handler, index) => {
              try {
                console.log('[WebSocket] Calling handler', index + 1);
                handler(normalizedMessage);
              } catch (handlerError) {
                console.error('[WebSocket] Handler error:', handlerError);
              }
            });
            console.log('[WebSocket] ====================================');
          } catch (error) {
            console.error('[WebSocket] ===== ERROR PARSING MESSAGE =====');
            console.error('[WebSocket] Error:', error);
            console.error('[WebSocket] ================================');
          }
        });

        console.log('[WebSocket] Subscription created:', !!subscription);
        this.subscriptions.set(conversationId, subscription);
        console.log('[WebSocket] Subscription stored. Total subscriptions:', this.subscriptions.size);
        console.log('[WebSocket] ====================================');
      } catch (error) {
        console.error('[WebSocket] Error creating subscription:', error);
      }
    } else {
      console.log('[WebSocket] Already subscribed to topic:', topic);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(conversationId);
      if (handlers) {
        const index = handlers.indexOf(onMessage);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        // Nếu không còn handler nào, unsubscribe
        if (handlers.length === 0) {
          const subscription = this.subscriptions.get(conversationId);
          if (subscription) {
            console.log('[WebSocket] Unsubscribing from:', topic);
            try {
              subscription.unsubscribe();
            } catch (error) {
              console.error('[WebSocket] Error unsubscribing:', error);
            }
            this.subscriptions.delete(conversationId);
            this.messageHandlers.delete(conversationId);
          }
        }
      }
    };
  }

  /**
   * Gửi tin nhắn qua WebSocket (optional, có thể dùng REST API)
   */
  sendMessage(destination: string, message: any): void {
    if (!this.isConnected || !this.client) {
      console.warn('[WebSocket] Not connected. Cannot send message.');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(message),
    });
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isActive(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Đăng ký callback khi kết nối thành công
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.onConnectCallbacks.push(callback);
    
    // Nếu đã connected, gọi callback ngay
    if (this.isConnected) {
      callback();
    }

    return () => {
      const index = this.onConnectCallbacks.indexOf(callback);
      if (index > -1) {
        this.onConnectCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Đăng ký callback khi ngắt kết nối
   */
  onDisconnect(callback: ConnectionCallback): () => void {
    this.onDisconnectCallbacks.push(callback);
    return () => {
      const index = this.onDisconnectCallbacks.indexOf(callback);
      if (index > -1) {
        this.onDisconnectCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Đăng ký callback khi có lỗi
   */
  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index > -1) {
        this.onErrorCallbacks.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
