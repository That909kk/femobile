import React, { useEffect, useState, useCallback } from 'react';
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

export const ConversationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userInfo } = useUserInfo();
  const { conversations, loading, fetchConversations } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get senderId (customerId hoặc employeeId) từ userInfo
  // API /api/v1/conversations/sender/{senderId} sẽ tự động tìm conversations
  // mà user là customer HOẶC employee
  const senderId = userInfo?.id;

  // Debug userInfo
  useEffect(() => {
    console.log('👤 ConversationList: UserInfo changed:', {
      hasUserInfo: !!userInfo,
      senderId,
      fullName: userInfo?.fullName,
    });
  }, [userInfo, senderId]);

  // Load conversations khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      console.log('📱 ConversationList: Screen focused, senderId:', senderId);
      if (senderId) {
        loadConversations();
      } else {
        console.log('⚠️ ConversationList: No senderId, skipping load');
      }
    }, [senderId])
  );

  const loadConversations = async () => {
    if (!senderId) {
      console.log('❌ ConversationList: No senderId available');
      return;
    }
    
    try {
      console.log('🔄 ConversationList: Loading conversations for senderId:', senderId);
      // Gọi API GET /api/v1/conversations/sender/{senderId}
      // Trả về TẤT CẢ conversations (kể cả đã xóa) với field canChat
      await fetchConversations(senderId, 0);
      console.log('✅ ConversationList: Loaded', conversations.length, 'conversations');
    } catch (error) {
      console.error('❌ ConversationList: Error loading conversations:', error);
    }
  };

  // Lọc chỉ hiển thị các conversations có thể chat
  const activeConversations = conversations.filter(conv => conv.canChat !== false);

  // Lọc theo tìm kiếm
  const filteredConversations = activeConversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const employeeName = (conv.employeeName || '').toLowerCase();
    const customerName = (conv.customerName || '').toLowerCase();
    
    return employeeName.includes(query) || customerName.includes(query);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Xác định tên người chat (không phải mình)
    const recipientName = conversation.employeeName || conversation.customerName;
    
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
    // Xác định thông tin người chat (không phải mình)
    const otherPersonName = item.employeeName || item.customerName;
    const otherPersonAvatar = item.employeeAvatar || item.customerAvatar;

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

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.neutral.textSecondary}
        />
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
        <Text style={styles.headerTitle}>Tin nhắn</Text>
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
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
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
