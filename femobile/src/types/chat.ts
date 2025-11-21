// Chat and Messaging types

export interface Conversation {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: 'CUSTOMER' | 'EMPLOYEE';
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  receiverType: 'CUSTOMER' | 'EMPLOYEE';
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  bookingId?: string;
  bookingCode?: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: 'CUSTOMER' | 'EMPLOYEE';
  content: string;
  messageType: ChatMessageType;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'BOOKING_INFO' | 'SYSTEM';

export interface ConversationList {
  conversations: Conversation[];
  totalUnread: number;
  page: number;
  totalPages: number;
}

export interface MessageList {
  messages: ChatMessage[];
  conversationId: string;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SendMessageRequest {
  conversationId?: string;
  receiverId: string;
  content: string;
  messageType?: ChatMessageType;
  mediaUrl?: string;
  bookingId?: string;
}

export interface CreateConversationRequest {
  receiverId: string;
  bookingId?: string;
  initialMessage?: string;
}

// WebSocket message payload
export interface WebSocketChatMessage {
  type: 'CHAT';
  action: 'NEW_MESSAGE' | 'MESSAGE_READ' | 'TYPING' | 'ONLINE' | 'OFFLINE';
  data: ChatMessage | { conversationId: string; userId: string };
  timestamp: string;
}
