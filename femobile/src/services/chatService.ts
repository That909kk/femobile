import { httpClient } from './httpClient';

export interface Conversation {
  conversationId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  bookingId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  isActive: boolean;
  canChat?: boolean; // Backend tính: false nếu isActive=false hoặc booking COMPLETED/CANCELLED
  createdAt: string;
  updatedAt: string;
}

// ConversationResponse is now just an alias since httpClient already wraps in ApiResponse
export type ConversationResponse = Conversation;

export interface ConversationListResponse {
  success: boolean;
  data: Conversation[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export type MessageType = 'TEXT' | 'IMAGE';

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string; // Account username (e.g., "john_doe"), NOT full name
  senderAvatar?: string;
  messageType: MessageType;
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string; // From REST API responses
  timestamp?: string; // From WebSocket real-time messages (alias for createdAt)
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data: ChatMessage;
}

export interface MessageListResponse {
  success: boolean;
  data: ChatMessage[];
  currentPage?: number;
  totalItems?: number;
  totalPages?: number;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    receiverId: string;
    conversationId?: string;
    unreadCount: number;
  };
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  data: {
    receiverId: string;
    conversationId?: string;
    markedCount: number;
  };
}

class ChatService {
  private readonly CONVERSATION_PATH = '/conversations';
  private readonly MESSAGE_PATH = '/messages';

  // ========== CONVERSATION APIs ==========

  async createConversation(data: {
    customerId: string;
    employeeId: string;
    bookingId?: string;
  }): Promise<Conversation> {
    const response = await httpClient.post<ConversationResponse>(this.CONVERSATION_PATH, data);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tao cuoc tro chuyen');
    }

    return response.data;
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await httpClient.get<ConversationResponse>(
      `${this.CONVERSATION_PATH}/${conversationId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay thong tin cuoc tro chuyen');
    }

    return response.data;
  }

  async getUserConversations(params?: {
    accountId: string;
    page?: number;
    size?: number;
  }): Promise<ConversationListResponse> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());

    const endpoint = `${this.CONVERSATION_PATH}/account/${params?.accountId}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await httpClient.get<ConversationListResponse>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Khong the lay danh sach cuoc tro chuyen');
    }

    return response.data as ConversationListResponse;
  }

  /**
   * Lấy conversations theo senderId (customerId hoặc employeeId)
   * API này linh hoạt hơn, trả về TẤT CẢ conversations (kể cả đã xóa)
   * Backend trả về ARRAY trực tiếp, không wrap trong {success, data}
   */
  async getConversationsBySender(params: {
    senderId: string;
    page?: number;
    size?: number;
  }): Promise<Conversation[]> {
    const query = new URLSearchParams();
    if (typeof params.page === 'number') query.append('page', params.page.toString());
    if (typeof params.size === 'number') query.append('size', params.size.toString());

    const endpoint = `${this.CONVERSATION_PATH}/sender/${params.senderId}${query.toString() ? `?${query.toString()}` : ''}`;
    
    const response = await httpClient.get<Conversation[]>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Khong the lay danh sach cuoc tro chuyen');
    }

    // Backend trả về array trực tiếp
    return response.data as Conversation[];
  }

  async getOrCreateConversation(customerId: string, employeeId: string): Promise<Conversation> {
    const response = await httpClient.get<ConversationResponse>(
      `${this.CONVERSATION_PATH}/get-or-create?customerId=${customerId}&employeeId=${employeeId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay hoac tao cuoc tro chuyen');
    }

    return response.data;
  }

  async getConversationByBooking(bookingId: string): Promise<Conversation> {
    const response = await httpClient.get<ConversationResponse>(
      `${this.CONVERSATION_PATH}/booking/${bookingId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay cuoc tro chuyen cua booking');
    }

    return response.data;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `${this.CONVERSATION_PATH}/${conversationId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the xoa cuoc tro chuyen');
    }

    return response.data?.success ?? response.success;
  }

  // ========== MESSAGE APIs ==========

  async sendTextMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<ChatMessage> {
    // Use URLSearchParams for application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('conversationId', data.conversationId);
    params.append('senderId', data.senderId); // Backend expects senderId (accountId)
    params.append('content', data.content);

    const response = await httpClient.post<ChatMessage>(
      `${this.MESSAGE_PATH}/send/text`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the gui tin nhan');
    }

    return response.data;
  }

  async sendImageMessage(data: {
    conversationId: string;
    senderId: string;
    imageFile: File | Blob;
    caption?: string;
  }): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    formData.append('senderId', data.senderId); // Backend expects senderId (accountId)
    formData.append('imageFile', data.imageFile);
    if (data.caption) {
      formData.append('caption', data.caption);
    }

    const response = await httpClient.post<ChatMessage>(
      `${this.MESSAGE_PATH}/send/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong te gui hinh anh');
    }

    return response.data;
  }

  async getMessages(conversationId: string, params?: { page?: number; size?: number }): Promise<MessageListResponse> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());

    const endpoint = `${this.MESSAGE_PATH}/conversation/${conversationId}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await httpClient.get<MessageListResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay danh sach tin nhan');
    }

    // response.data là MessageListResponse từ backend
    return response.data;
  }

  async getAllMessages(conversationId: string): Promise<ChatMessage[]> {
    const response = await httpClient.get<ChatMessage[]>(
      `${this.MESSAGE_PATH}/conversation/${conversationId}/all`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay tat ca tin nhan');
    }

    return response.data;
  }

  /**
   * Get unread count for a specific conversation
   * @param conversationId - ID of the conversation
   * @param receiverId - ID of the receiver (customerId or employeeId)
   */
  async getUnreadCountByConversation(conversationId: string, receiverId: string): Promise<number> {
    try {
      const endpoint = `${this.MESSAGE_PATH}/conversation/${conversationId}/unread-count?receiverId=${receiverId}`;
      
      const response = await httpClient.get<UnreadCountResponse>(endpoint);

      if (!response.success || !response.data) {
        return 0;
      }

      return response.data.data?.unreadCount ?? 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get total unread count across all conversations
   * @param receiverId - ID of the receiver (customerId or employeeId)
   */
  async getTotalUnreadCount(receiverId: string): Promise<number> {
    try {
      const endpoint = `${this.MESSAGE_PATH}/unread-count?receiverId=${receiverId}`;
      
      const response = await httpClient.get<UnreadCountResponse>(endpoint);

      if (!response.success || !response.data) {
        return 0;
      }

      return response.data.data?.unreadCount ?? 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Mark messages as read in a specific conversation
   * @param conversationId - ID of the conversation
   * @param receiverId - ID of the receiver (customerId or employeeId)
   */
  async markConversationAsRead(conversationId: string, receiverId: string): Promise<number> {
    try {
      const response = await httpClient.put<MarkReadResponse>(
        `${this.MESSAGE_PATH}/conversation/${conversationId}/mark-read?receiverId=${receiverId}`,
        {},
      );

      if (!response.success || !response.data) {
        console.warn('[ChatService] markConversationAsRead failed:', response.message);
        return 0;
      }

      return response.data.data?.markedCount ?? 0;
    } catch (error) {
      console.error('[ChatService] markConversationAsRead error:', error);
      return 0;
    }
  }

  /**
   * Mark all messages as read across all conversations
   * @param receiverId - ID of the receiver (customerId or employeeId)
   */
  async markAllAsRead(receiverId: string): Promise<number> {
    try {
      const response = await httpClient.put<MarkReadResponse>(
        `${this.MESSAGE_PATH}/mark-all-read?receiverId=${receiverId}`,
        {},
      );

      if (!response.success || !response.data) {
        console.warn('[ChatService] markAllAsRead failed:', response.message);
        return 0;
      }

      return response.data.data?.markedCount ?? 0;
    } catch (error) {
      console.error('[ChatService] markAllAsRead error:', error);
      return 0;
    }
  }

  // Legacy methods - kept for backward compatibility
  async getUnreadCount(conversationId: string): Promise<number> {
    console.warn('[ChatService] getUnreadCount is deprecated, use getUnreadCountByConversation instead');
    return 0;
  }

  async markMessagesAsRead(conversationId: string, receiverId: string): Promise<boolean> {
    console.warn('[ChatService] markMessagesAsRead is deprecated, use markConversationAsRead instead');
    const markedCount = await this.markConversationAsRead(conversationId, receiverId);
    return markedCount > 0;
  }
}

export const chatService = new ChatService();
