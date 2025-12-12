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

// DTO for conversation summary from WebSocket (giống web)
export interface ConversationSummaryDTO {
  conversationId: string;
  senderId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

type SummaryHandler = (summary: ConversationSummaryDTO) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private summarySubscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Map<string, MessageCallback[]> = new Map();
  private summaryHandlers: Map<string, SummaryHandler[]> = new Map();
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
      return;
    }

    if (this.isConnecting) {
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

        // Tạo SockJS socket - giống y hệt web app
        const socket = new SockJS(wsUrl);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          reconnectDelay: 0, // Disable auto-reconnect
          heartbeatIncoming: 10000, // 10 seconds (giống web)
          heartbeatOutgoing: 10000, // 10 seconds (giống web)
        });

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
            this.isConnecting = false;
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
      // Hủy tất cả message subscriptions
      this.subscriptions.forEach((subscription, conversationId) => {
        try {
          subscription.unsubscribe();
        } catch (e) {
          // Ignore unsubscribe error
        }
      });
      this.subscriptions.clear();
      this.messageHandlers.clear();
      
      // Hủy tất cả summary subscriptions
      this.summarySubscriptions.forEach((subscription, participantId) => {
        try {
          subscription.unsubscribe();
        } catch (e) {
          // Ignore unsubscribe error
        }
      });
      this.summarySubscriptions.clear();
      this.summaryHandlers.clear();
      
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
    if (!this.isConnected || !this.client) {
      return () => {};
    }

    const topic = `/topic/conversation/${conversationId}`;
    
    // Thêm message handler
    if (!this.messageHandlers.has(conversationId)) {
      this.messageHandlers.set(conversationId, []);
    }
    this.messageHandlers.get(conversationId)!.push(onMessage);

    // Nếu chưa subscribe topic này
    if (!this.subscriptions.has(conversationId)) {
      try {
        const subscription = this.client.subscribe(topic, (message: IMessage) => {
          try {
            const chatMessage: ChatMessage = JSON.parse(message.body);
            
            // Normalize message: ensure it has createdAt
            const normalizedMessage: ChatMessage = {
              ...chatMessage,
              createdAt: chatMessage.createdAt || chatMessage.timestamp || new Date().toISOString(),
              timestamp: chatMessage.timestamp || chatMessage.createdAt || new Date().toISOString(),
            };
            
            // Gọi tất cả handlers cho conversation này
            const handlers = this.messageHandlers.get(conversationId) || [];
            handlers.forEach((handler, index) => {
              try {
                handler(normalizedMessage);
              } catch (handlerError) {
                // Handler error - ignore
              }
            });
          } catch (error) {
            // Parse error - ignore
          }
        });

        this.subscriptions.set(conversationId, subscription);
      } catch (error) {
        // Subscription error - ignore
      }
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
            try {
              subscription.unsubscribe();
            } catch (error) {
              // Ignore unsubscribe error
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
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(message),
    });
  }

  /**
   * Subscribe to conversation summary (realtime unread count + last message)
   * Topic: /topic/conversation/summary/{participantId}
   * @param participantId customerId hoặc employeeId của participant
   * @param handler Callback xử lý summary
   */
  subscribeToConversationSummary(participantId: string, handler: SummaryHandler): () => void {
    if (!this.isConnected || !this.client) {
      return () => {};
    }

    // Lưu handler
    if (!this.summaryHandlers.has(participantId)) {
      this.summaryHandlers.set(participantId, []);
    }
    this.summaryHandlers.get(participantId)!.push(handler);

    // Nếu đã subscribe rồi thì không subscribe lại
    if (this.summarySubscriptions.has(participantId)) {
      return () => this.unsubscribeFromConversationSummary(participantId, handler);
    }

    const destination = `/topic/conversation/summary/${participantId}`;

    try {
      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const data: ConversationSummaryDTO = JSON.parse(message.body);

          // Gọi tất cả handlers cho participant này
          const handlers = this.summaryHandlers.get(participantId) || [];
          handlers.forEach(h => {
            try {
              h(data);
            } catch (handlerError) {
              // Handler error - ignore
            }
          });
        } catch (error) {
          // Parse error - ignore
        }
      });

      this.summarySubscriptions.set(participantId, subscription);
    } catch (error) {
      // Subscription error - ignore
    }

    return () => this.unsubscribeFromConversationSummary(participantId, handler);
  }

  /**
   * Unsubscribe from conversation summary
   */
  unsubscribeFromConversationSummary(participantId: string, handler?: SummaryHandler): void {
    const handlers = this.summaryHandlers.get(participantId);
    
    if (handlers && handler) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      // Nếu không còn handler nào, unsubscribe hoàn toàn
      if (handlers.length === 0) {
        const subscription = this.summarySubscriptions.get(participantId);
        if (subscription) {
          try {
            subscription.unsubscribe();
          } catch (error) {
            // Ignore unsubscribe error
          }
          this.summarySubscriptions.delete(participantId);
          this.summaryHandlers.delete(participantId);
        }
      }
    } else if (!handler) {
      // Unsubscribe tất cả
      const subscription = this.summarySubscriptions.get(participantId);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          // Ignore unsubscribe error
        }
        this.summarySubscriptions.delete(participantId);
        this.summaryHandlers.delete(participantId);
      }
    }
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
