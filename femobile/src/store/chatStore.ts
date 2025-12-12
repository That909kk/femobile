import { create } from 'zustand';
import {
  Conversation,
  ChatMessage,
  chatService,
} from '../services/chatService';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  totalUnread: number;
  loading: boolean;
  sending: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

interface ChatActions {
  fetchConversations: (accountId: string, page?: number) => Promise<void>;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  fetchTotalUnread: (receiverId: string) => Promise<void>;
  sendTextMessage: (conversationId: string, senderId: string, content: string) => Promise<void>;
  sendImageMessage: (conversationId: string, senderId: string, imageFile: File | Blob, caption?: string) => Promise<void>;
  createConversation: (customerId: string, employeeId: string, bookingId?: string) => Promise<Conversation>;
  getOrCreateConversation: (customerId: string, employeeId: string) => Promise<Conversation>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  markConversationAsRead: (conversationId: string, receiverId: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateTotalUnread: (count: number) => void;
  decrementUnread: (amount?: number) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  messages: [],
  totalUnread: 0,
  loading: false,
  sending: false,
  error: null,
  hasMore: true,
  currentPage: 0,

  // Fetch total unread count
  fetchTotalUnread: async (receiverId: string) => {
    try {
      const count = await chatService.getTotalUnreadCount(receiverId);
      set({ totalUnread: count });
    } catch (error: any) {
      // Silent fail
    }
  },

  // Update total unread count directly
  updateTotalUnread: (count: number) => {
    set({ totalUnread: count });
  },

  // Decrement unread count
  decrementUnread: (amount: number = 1) => {
    set(state => ({ totalUnread: Math.max(0, state.totalUnread - amount) }));
  },

  // Fetch conversations by senderId (customerId hoặc employeeId)
  // API này linh hoạt hơn và trả về field canChat để xử lý UI
  // Backend trả về ARRAY trực tiếp, không wrap trong {success, data}
  fetchConversations: async (senderId: string, page = 0) => {
    try {
      set({ loading: true, error: null });
      const conversations = await chatService.getConversationsBySender({ senderId, page, size: 20 });
      
      if (Array.isArray(conversations)) {
        set({
          conversations: page === 0 ? conversations : [
            ...get().conversations,
            ...conversations,
          ],
          totalUnread: 0, // Will be calculated separately
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Không thể tải danh sách hội thoại', loading: false });
    }
  },

  // Fetch messages
  fetchMessages: async (conversationId: string, page = 0) => {
    try {
      set({ loading: true, error: null });
      const response = await chatService.getMessages(conversationId, { page, size: 50 });
      
      if (response.success && response.data) {
        const hasMore = response.currentPage !== undefined && response.totalPages !== undefined
          ? response.currentPage < response.totalPages - 1
          : false;
          
        set({
          messages: page === 0 ? response.data : [
            ...response.data,
            ...get().messages,
          ],
          hasMore,
          currentPage: page,
          loading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Không thể tải tin nhắn', loading: false });
    }
  },

  // Send text message
  sendTextMessage: async (conversationId: string, senderId: string, content: string) => {
    try {
      set({ sending: true, error: null });
      const message = await chatService.sendTextMessage({ conversationId, senderId, content });
      
      set(state => ({
        messages: [...state.messages, message],
        sending: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể gửi tin nhắn', sending: false });
      throw error;
    }
  },

  // Send image message
  sendImageMessage: async (conversationId: string, senderId: string, imageFile: File | Blob, caption?: string) => {
    try {
      set({ sending: true, error: null });
      const message = await chatService.sendImageMessage({ conversationId, senderId, imageFile, caption });
      
      set(state => ({
        messages: [...state.messages, message],
        sending: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể gửi hình ảnh', sending: false });
      throw error;
    }
  },

  // Create conversation
  createConversation: async (customerId: string, employeeId: string, bookingId?: string) => {
    try {
      set({ loading: true, error: null });
      const conversation = await chatService.createConversation({ customerId, employeeId, bookingId });
      
      set(state => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation,
        loading: false,
      }));
      return conversation;
    } catch (error: any) {
      set({ error: error.message || 'Không thể tạo hội thoại', loading: false });
      throw error;
    }
  },

  // Get or create conversation
  getOrCreateConversation: async (customerId: string, employeeId: string) => {
    try {
      set({ loading: true, error: null });
      const conversation = await chatService.getOrCreateConversation(customerId, employeeId);
      
      set(state => ({
        currentConversation: conversation,
        loading: false,
      }));
      return conversation;
    } catch (error: any) {
      set({ error: error.message || 'Không thể lấy hội thoại', loading: false });
      throw error;
    }
  },

  // Set current conversation
  setCurrentConversation: (conversation: Conversation | null) => {
    set({ 
      currentConversation: conversation,
      messages: [],
      hasMore: true,
      currentPage: 0,
    });
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId: string, receiverId: string) => {
    try {
      await chatService.markMessagesAsRead(conversationId, receiverId);
      
      set(state => ({
        conversations: state.conversations,
        totalUnread: Math.max(0, state.totalUnread - 1),
      }));
    } catch (error: any) {
      console.error('Failed to mark conversation as read:', error);
    }
  },

  // Add message (for real-time updates)
  addMessage: (message: ChatMessage) => {
    set(state => {
      const isCurrentConversation = state.currentConversation?.conversationId === message.conversationId;
      
      return {
        messages: isCurrentConversation ? [...state.messages, message] : state.messages,
        totalUnread: isCurrentConversation ? state.totalUnread : state.totalUnread + 1,
      };
    });
  },

  // Clear messages
  clearMessages: () => {
    set({
      messages: [],
      currentConversation: null,
      hasMore: true,
      currentPage: 0,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
