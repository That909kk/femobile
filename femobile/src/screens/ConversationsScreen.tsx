import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { chatService } from '../services';
import type { Conversation } from '../services/chatService';
import { useAuthStore } from '../store/authStore';
import { colors } from '../styles';

type RootStackParamList = {
  ConversationsScreen: undefined;
  ChatScreen: { conversationId: string; recipientName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function để lấy account ID
const getAccountId = (user: any, role: string | null): string | null => {
  if (!user || !role) return null;
  if (role === 'CUSTOMER') return user.customerId;
  if (role === 'EMPLOYEE') return user.employeeId;
  if (role === 'ADMIN') return user.adminId;
  return null;
};

export const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, role } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const accountId = getAccountId(user, role);
    if (!accountId) return;

    try {
      setLoading(true);
      const response = await chatService.getUserConversations({ accountId, page: 0, size: 50 });
      setConversations(response.data || []);
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

    const hasUnread = false; // TODO: Implement unread count

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
              5
            </Badge>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.recipientName} numberOfLines={1}>
              {recipientName}
            </Text>
            <Text style={styles.timestamp}>
              {item.lastMessageTime
                ? new Date(item.lastMessageTime).toLocaleDateString('vi-VN', {
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
            {item.lastMessage || 'Chưa có tin nhắn'}
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
