import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useChatStore } from '../../../store/chatStore';
import { useUserInfo } from '../../../hooks';
import { colors, responsiveSpacing, responsiveFontSize } from '../../../styles';
import type { Conversation } from '../../../services/chatService';
import { websocketService, type ConversationSummaryDTO } from '../../../services/websocketService';
import { ConversationUnreadBadge } from '../../../components';
import { useAuthStore } from '../../../store/authStore';

// Helper function để lấy senderId (customerId hoặc employeeId)
const getSenderId = (user: any, role: string | null): string | null => {
  if (!user || !role) return null;
  if (role === 'CUSTOMER') return user.customerId;
  if (role === 'EMPLOYEE') return user.employeeId;
  if (role === 'ADMIN') return user.adminId;
  return null;
};

export const ConversationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userInfo } = useUserInfo();
  const { user, role } = useAuthStore();
  const { conversations, loading, totalUnread, fetchConversations, fetchTotalUnread } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  
  // State để lưu lastMessage và lastMessageTime từ WebSocket
  const [conversationSummaries, setConversationSummaries] = useState<Map<string, { lastMessage: string; lastMessageTime: string }>>(new Map());
  
  // Ref để track subscribed status
  const summarySubscribedRef = useRef(false);

  // Get senderId (customerId hoặc employeeId) từ user dựa vào role
  const senderId = getSenderId(user, role) || userInfo?.id;
  const accountId = user?.accountId;

  // Refresh unread count using store (syncs with bottom tab badge)
  const refreshUnreadCount = useCallback(() => {
    if (senderId) {
      fetchTotalUnread(senderId);
    }
  }, [senderId, fetchTotalUnread]);

  // Handler cho conversation summary từ WebSocket (giống web)
  const handleConversationSummary = useCallback((summary: ConversationSummaryDTO) => {
    // Cập nhật lastMessage và lastMessageTime
    setConversationSummaries(prev => {
      const newMap = new Map(prev);
      newMap.set(summary.conversationId, {
        lastMessage: summary.lastMessage,
        lastMessageTime: summary.lastMessageTime
      });
      return newMap;
    });
    
    // Refresh unread count
    refreshUnreadCount();
  }, [accountId, refreshUnreadCount]);

  // Kết nối WebSocket và subscribe to conversation summary
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupWebSocket = async () => {
      if (!senderId) {
        return;
      }

      try {
        // Kết nối WebSocket nếu chưa kết nối
        if (!websocketService.isActive()) {
          await websocketService.connect();
        }
        
        setWsConnected(true);
        
        // Subscribe to conversation summary
        if (!summarySubscribedRef.current) {
          unsubscribe = websocketService.subscribeToConversationSummary(senderId, handleConversationSummary);
          summarySubscribedRef.current = true;
        }
      } catch (error) {
        setWsConnected(false);
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        summarySubscribedRef.current = false;
      }
    };
  }, [senderId, handleConversationSummary]);

  // Load conversations khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      if (senderId) {
        loadConversations();
      }
    }, [senderId])
  );

  const loadConversations = async () => {
    if (!senderId) {
      return;
    }
    
    try {
      // Gọi API GET /api/v1/conversations/sender/{senderId}
      // Trả về TẤT CẢ conversations (kể cả đã xóa) với field canChat
      await fetchConversations(senderId, 0);
    } catch (error) {
      console.error('❌ ConversationList: Error loading conversations:', error);
    }
  };

  // Merge conversations với realtime summaries
  const mergedConversations = conversations.map(conv => {
    const realtimeSummary = conversationSummaries.get(conv.conversationId);
    if (realtimeSummary) {
      return {
        ...conv,
        lastMessage: realtimeSummary.lastMessage,
        lastMessageTime: realtimeSummary.lastMessageTime,
      };
    }
    return conv;
  });

  // Lọc chỉ hiển thị các conversations có thể chat
  const activeConversations = mergedConversations.filter(conv => conv.canChat !== false);

  // Lọc theo tìm kiếm - dựa vào role để lọc đúng tên người đối thoại
  const filteredConversations = activeConversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    // Nếu mình là Employee → tìm theo customerName
    // Nếu mình là Customer → tìm theo employeeName
    const otherPersonName = role === 'EMPLOYEE'
      ? (conv.customerName || '').toLowerCase()
      : (conv.employeeName || '').toLowerCase();
    
    return otherPersonName.includes(query);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadConversations(),
      refreshUnreadCount(), // Also refresh unread count
    ]);
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Xác định tên người chat (không phải mình) dựa vào role
    // Nếu mình là Customer → hiển thị Employee
    // Nếu mình là Employee → hiển thị Customer
    const recipientName = role === 'EMPLOYEE'
      ? conversation.customerName
      : conversation.employeeName;
    
    // Navigate từ Tab Navigator lên Parent Stack Navigator
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('ChatScreen', {
        conversationId: conversation.conversationId,
        recipientName,
      });
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    // Xác định thông tin người chat (không phải mình) dựa vào role
    // Nếu mình là Customer → hiển thị Employee
    // Nếu mình là Employee → hiển thị Customer
    const otherPersonName = role === 'EMPLOYEE'
      ? item.customerName
      : item.employeeName;
    const otherPersonAvatar = role === 'EMPLOYEE'
      ? item.customerAvatar
      : item.employeeAvatar;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: otherPersonAvatar || 'https://picsum.photos/50',
          }}
          style={styles.avatar}
        />
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.personName} numberOfLines={1}>
              {otherPersonName}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          
          <View style={styles.messagePreview}>
            <Text
              style={styles.lastMessage}
              numberOfLines={1}
            >
              {item.lastMessage || 'Chưa có tin nhắn'}
            </Text>
            
            {item.bookingId && (
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.neutral.textSecondary}
                style={styles.bookingIcon}
              />
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          <ConversationUnreadBadge conversationId={item.conversationId} />
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.neutral.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isSearching ? "search-outline" : "chatbubbles-outline"}
          size={80}
          color={colors.neutral.border}
        />
        <Text style={styles.emptyTitle}>
          {isSearching ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isSearching 
            ? `Không có cuộc trò chuyện nào với "${searchQuery}"`
            : 'Các cuộc trò chuyện với nhân viên sẽ hiển thị tại đây'
          }
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.highlight.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Tin nhắn</Text>
            {wsConnected && (
              <View style={styles.wsIndicator}>
                <View style={styles.wsIndicatorDot} />
              </View>
            )}
          </View>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.neutral.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.neutral.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.neutral.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.conversationId}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.highlight.teal]}
            tintColor={colors.highlight.teal}
          />
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
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  wsIndicator: {
    marginLeft: responsiveSpacing.xs,
  },
  wsIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.feedback.success,
  },
  headerBadge: {
    backgroundColor: colors.feedback.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: responsiveSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  searchIcon: {
    marginRight: responsiveSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    paddingVertical: responsiveSpacing.xs,
  },
  clearButton: {
    padding: responsiveSpacing.xs,
  },
  listContent: {
    paddingVertical: responsiveSpacing.xs,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral.border,
    marginRight: responsiveSpacing.md,
  },
  conversationContent: {
    flex: 1,
    marginRight: responsiveSpacing.sm,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personName: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginRight: responsiveSpacing.sm,
  },
  time: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginRight: responsiveSpacing.xs,
  },
  bookingIcon: {
    marginLeft: responsiveSpacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.xxl,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.xs,
  },
  emptySubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
