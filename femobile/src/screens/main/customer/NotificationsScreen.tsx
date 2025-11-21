import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useEnsureValidToken } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import {
  notificationService,
  type Notification,
  type NotificationType,
} from '../../../services';

const TEAL_COLOR = '#1bb5a6';

const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'BOOKING_CREATED':
      return 'calendar-outline';
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_VERIFIED':
      return 'checkmark-circle-outline';
    case 'BOOKING_CANCELLED':
    case 'BOOKING_REJECTED':
      return 'close-circle-outline';
    case 'BOOKING_COMPLETED':
      return 'checkmark-done-circle-outline';
    case 'ASSIGNMENT_CREATED':
    case 'ASSIGNMENT_ASSIGNED':
      return 'person-add-outline';
    case 'ASSIGNMENT_COMPLETED':
      return 'checkmark-done-outline';
    case 'ASSIGNMENT_CANCELLED':
      return 'close-outline';
    case 'ASSIGNMENT_CRISIS':
      return 'warning-outline';
    case 'PAYMENT_SUCCESS':
      return 'card-outline';
    case 'PAYMENT_FAILED':
      return 'alert-circle-outline';
    case 'REVIEW_RECEIVED':
      return 'star-outline';
    case 'PROMOTION_AVAILABLE':
      return 'pricetag-outline';
    case 'SYSTEM_ANNOUNCEMENT':
    case 'SYSTEM':
      return 'notifications-outline';
    default:
      return 'mail-outline';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'URGENT':
      return '#ff4757';
    case 'HIGH':
      return '#ffa502';
    case 'NORMAL':
      return TEAL_COLOR;
    case 'LOW':
      return '#95afc0';
    default:
      return TEAL_COLOR;
  }
};

const formatDateTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) return dateTimeStr;

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
    year: 'numeric',
  });
};

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const ensureValidToken = useEnsureValidToken();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (isRefreshing = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      await ensureValidToken.ensureValidToken();

      const response = await notificationService.getNotifications({
        page: 0,
        size: 50,
        unreadOnly: filter === 'unread',
      });

      // Response trả về trực tiếp là { success, data, currentPage, totalItems, totalPages }
      setNotifications(response.data || []);

      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      // Không hiển thị alert nữa, chỉ set empty array
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, [user, ensureValidToken, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await ensureValidToken.ensureValidToken();
      await notificationService.markAsRead(notificationId);
      // Cập nhật lại danh sách
      fetchNotifications();
    } catch (error: any) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ensureValidToken.ensureValidToken();
      await notificationService.markAllAsRead();
      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
      // Cập nhật lại danh sách
      fetchNotifications();
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả đã đọc');
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureValidToken.ensureValidToken();
            await notificationService.deleteNotification(notificationId);
            // Cập nhật lại danh sách
            fetchNotifications();
          } catch (error: any) {
            console.error('Delete notification error:', error);
            Alert.alert('Lỗi', 'Không thể xóa thông báo');
          }
        },
      },
    ]);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.notificationId);
    }
    // TODO: Navigate to related screen based on relatedType and relatedId
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getPriorityColor(item.priority) + '20' },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={getPriorityColor(item.priority)}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadBadge} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.notificationId)}
        >
          <Ionicons name="trash-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL_COLOR} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={styles.placeholder} />}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.notificationId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TEAL_COLOR]}
            tintColor={TEAL_COLOR}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' 
                ? 'Tất cả thông báo đã được đọc' 
                : 'Các thông báo sẽ xuất hiện ở đây'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEAL_COLOR,
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: UI.SPACING.md,
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.sm,
    gap: UI.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: TEAL_COLOR,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: UI.SPACING.md,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: UI.SPACING.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: TEAL_COLOR,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: UI.SPACING.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI.SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEAL_COLOR,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
    marginLeft: UI.SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: UI.SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: UI.SPACING.sm,
    textAlign: 'center',
  },
});
