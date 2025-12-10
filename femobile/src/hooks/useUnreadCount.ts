import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

interface UseUnreadCountResult {
  unreadCount: number;
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
}

/**
 * Hook to get unread count for a specific conversation
 * @param conversationId - ID of the conversation
 * @param enabled - Whether to fetch unread count (default: true)
 * @param refreshInterval - Auto-refresh interval in ms (default: 10000 = 10s, set to 0 to disable)
 */
export const useUnreadCountByConversation = (
  conversationId: string | null,
  enabled: boolean = true,
  refreshInterval: number = 10000,
): UseUnreadCountResult => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, role } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get receiverId (customerId or employeeId)
  const receiverId = role === 'CUSTOMER' 
    ? (user as any)?.customerId 
    : role === 'EMPLOYEE' 
    ? (user as any)?.employeeId 
    : role === 'ADMIN'
    ? (user as any)?.adminId
    : null;

  const fetchUnreadCount = useCallback(async () => {
    console.log('[useUnreadCountByConversation] Fetching:', {
      conversationId,
      receiverId,
      enabled,
      role,
    });

    if (!conversationId || !receiverId || !enabled) {
      console.log('[useUnreadCountByConversation] Skipping fetch - missing params');
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await chatService.getUnreadCountByConversation(conversationId, receiverId);
      console.log('[useUnreadCountByConversation] Result:', { conversationId, count });
      setUnreadCount(count);
    } catch (error) {
      console.error('[useUnreadCountByConversation] Error:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [conversationId, receiverId, enabled, role]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnreadCount, enabled, refreshInterval]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
  };
};

/**
 * Hook to get total unread count across all conversations
 * @param enabled - Whether to fetch unread count (default: true)
 * @param refreshInterval - Auto-refresh interval in ms (default: 30000 = 30s, set to 0 to disable)
 */
export const useTotalUnreadCount = (
  enabled: boolean = true,
  refreshInterval: number = 30000,
): UseUnreadCountResult => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, role } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get receiverId (customerId or employeeId)
  const receiverId = role === 'CUSTOMER' 
    ? (user as any)?.customerId 
    : role === 'EMPLOYEE' 
    ? (user as any)?.employeeId 
    : role === 'ADMIN'
    ? (user as any)?.adminId
    : null;

  const fetchUnreadCount = useCallback(async () => {
    console.log('[useTotalUnreadCount] Fetching:', {
      receiverId,
      enabled,
      role,
      hasUser: !!user,
    });

    if (!receiverId || !enabled) {
      console.log('[useTotalUnreadCount] Skipping fetch - missing params');
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await chatService.getTotalUnreadCount(receiverId);
      console.log('[useTotalUnreadCount] Result:', { receiverId, count });
      setUnreadCount(count);
    } catch (error) {
      console.error('[useTotalUnreadCount] Error:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [receiverId, enabled, role, user]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnreadCount, enabled, refreshInterval]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
  };
};

/**
 * Hook to mark conversation as read
 */
export const useMarkAsRead = () => {
  const { user, role } = useAuthStore();
  const { decrementUnread, fetchTotalUnread } = useChatStore();
  const receiverId = role === 'CUSTOMER' 
    ? (user as any)?.customerId 
    : role === 'EMPLOYEE' 
    ? (user as any)?.employeeId 
    : role === 'ADMIN'
    ? (user as any)?.adminId
    : null;

  const markConversationAsRead = useCallback(
    async (conversationId: string): Promise<number> => {
      if (!receiverId) {
        console.warn('[useMarkAsRead] No receiverId available');
        return 0;
      }

      try {
        const markedCount = await chatService.markConversationAsRead(conversationId, receiverId);
        console.log(`[useMarkAsRead] Marked ${markedCount} messages as read in ${conversationId}`);
        
        // Update chatStore to sync with bottom tab badge
        if (markedCount > 0) {
          // Refresh total unread from server to get accurate count
          fetchTotalUnread(receiverId);
        }
        
        return markedCount;
      } catch (error) {
        console.error('[useMarkAsRead] Error:', error);
        return 0;
      }
    },
    [receiverId, fetchTotalUnread],
  );

  const markAllAsRead = useCallback(async (): Promise<number> => {
    if (!receiverId) {
      console.warn('[useMarkAsRead] No receiverId available');
      return 0;
    }

    try {
      const markedCount = await chatService.markAllAsRead(receiverId);
      console.log(`[useMarkAsRead] Marked ${markedCount} messages as read across all conversations`);
      
      // Update chatStore - set to 0 since all are read
      if (markedCount > 0) {
        useChatStore.getState().updateTotalUnread(0);
      }
      
      return markedCount;
    } catch (error) {
      console.error('[useMarkAsRead] Error:', error);
      return 0;
    }
  }, [receiverId]);

  return {
    markConversationAsRead,
    markAllAsRead,
  };
};
