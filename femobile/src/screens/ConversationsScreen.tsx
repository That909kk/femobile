import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text, Avatar, Badge, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { chatService, websocketService } from '../services';
import type { Conversation } from '../services/chatService';
import type { ConversationSummaryDTO } from '../services/websocketService';
import { useAuthStore } from '../store/authStore';
import { colors } from '../styles';

type RootStackParamList = {
  ConversationsScreen: undefined;
  ChatScreen: { conversationId: string; recipientName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function để lấy senderId (customerId hoặc employeeId) - dùng cho lấy danh sách conversations
const getSenderId = (user: any, role: string | null): string | null => {
  if (!user || !role) return null;
  if (role === 'CUSTOMER') return user.customerId;
  if (role === 'EMPLOYEE') return user.employeeId;
  if (role === 'ADMIN') return user.adminId;
  return null;
};

export const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, role } = useAuthStore();
  
  // senderId dùng để lấy danh sách conversations (customerId/employeeId)
  const senderId = getSenderId(user, role);
  // accountId dùng cho send message & mark-read
  const accountId = user?.accountId;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  
  // State để lưu unread counts và last message từ WebSocket
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [conversationSummaries, setConversationSummaries] = useState<Map<string, { lastMessage: string; lastMessageTime: string }>>(new Map());
  
  // Ref để track subscription status
  const summarySubscribedRef = useRef(false);

  // Handler cho conversation summary từ WebSocket (giống web)
  const handleConversationSummary = useCallback((summary: ConversationSummaryDTO) => {
    // Nếu tin nhắn được gửi bởi chính mình (summary.senderId === accountId), bỏ qua unread count
    const isMyMessage = summary.senderId === accountId;
    
    // Cập nhật unread count
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      const currentCount = prev.get(summary.conversationId) || 0;
      
      if (isMyMessage) {
        // Tin nhắn của mình gửi đi -> không thay đổi unread count
      } else {
        // Tin nhắn từ người khác
        newMap.set(summary.conversationId, currentCount + 1);
      }
      
      return newMap;
    });
    
    // Cập nhật lastMessage và lastMessageTime
    setConversationSummaries(prev => {
      const newMap = new Map(prev);
      newMap.set(summary.conversationId, {
        lastMessage: summary.lastMessage,
        lastMessageTime: summary.lastMessageTime
      });
      return newMap;
    });
  }, [accountId]);

  // Connect WebSocket và subscribe to summary
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const connectAndSubscribe = async () => {
      if (!senderId) return;
      
      try {
        // Kết nối WebSocket nếu chưa kết nối
        if (!websocketService.isActive()) {
          await websocketService.connect();
        }
        
        setWsConnected(websocketService.isActive());
        
        // Subscribe to conversation summary
        if (websocketService.isActive() && !summarySubscribedRef.current) {
          unsubscribe = websocketService.subscribeToConversationSummary(senderId, handleConversationSummary);
          summarySubscribedRef.current = true;
        }
      } catch (error) {
        console.warn('[ConversationsScreen] WebSocket connection failed:', error);
        setWsConnected(false);
      }
    };
    
    connectAndSubscribe();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      summarySubscribedRef.current = false;
    };
  }, [senderId, handleConversationSummary]);

  // Reload conversations khi focus lại màn hình
  useFocusEffect(
    useCallback(() => {
      if (senderId) {
        loadConversations();
      }
    }, [senderId])
  );

  useEffect(() => {
    loadConversations();
  }, [senderId]);

  const loadConversations = async () => {
    if (!senderId) return;

    try {
      setLoading(true);
      // Sử dụng getConversationsBySender với senderId (customerId/employeeId) như web
      const data = await chatService.getConversationsBySender({ senderId, page: 0, size: 50 });
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Xác định tên người nhận
    const recipientName = role === 'EMPLOYEE'
      ? conversation.customerName
      : conversation.employeeName;

    // Clear unread count khi vào conversation
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(conversation.conversationId, 0);
      return newMap;
    });

    navigation.navigate('ChatScreen', {
      conversationId: conversation.conversationId,
      recipientName,
    });
  };

  const filteredConversations = conversations.filter((conv) => {
    const recipientName = role === 'EMPLOYEE'
      ? conv.customerName
      : conv.employeeName;
    
    return recipientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderConversation = ({ item }: { item: Conversation }) => {
    const recipientName = role === 'EMPLOYEE'
      ? item.customerName
      : item.employeeName;
    
    const recipientAvatar = role === 'EMPLOYEE'
      ? item.customerAvatar
      : item.employeeAvatar;

    // Lấy unread count từ state
    const unreadCount = unreadCounts.get(item.conversationId) || 0;
    const hasUnread = unreadCount > 0;
    
    // Lấy last message từ WebSocket summary hoặc từ item
    const summary = conversationSummaries.get(item.conversationId);
    const lastMessage = summary?.lastMessage || item.lastMessage;
    const lastMessageTime = summary?.lastMessageTime || item.lastMessageTime;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={56}
            source={{ uri: recipientAvatar || 'https://via.placeholder.com/150' }}
          />
          {hasUnread && (
            <Badge style={styles.badge} size={20}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.recipientName, hasUnread && styles.unreadName]} numberOfLines={1}>
              {recipientName}
            </Text>
            <Text style={styles.timestamp}>
              {lastMessageTime
                ? new Date(lastMessageTime).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                : ''}
            </Text>
          </View>

          <Text
            style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
            numberOfLines={1}
          >
            {lastMessage || 'Chưa có tin nhắn'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.highlight.teal} />
        </View>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
      </View>

      <Searchbar
        placeholder="Tìm kiếm cuộc hội thoại..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.conversationId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có cuộc hội thoại nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: colors.warm.beige,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  searchbar: {
    margin: 12,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.feedback.error,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
    flex: 1,
  },
  unreadName: {
    fontWeight: '700',
    color: colors.primary.navy,
  },
  timestamp: {
    fontSize: 12,
    color: colors.neutral.textSecondary,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.neutral.textSecondary,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
