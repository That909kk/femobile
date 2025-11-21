import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../../hooks';
import { recurringBookingService } from '../../../../services';
import type { RecurringBookingResponse } from '../../../../types';
import { colors, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import { Button, SkeletonPlaceholder } from '../../../../components';

const PAGE_SIZE = 10;

const STATUS_META: Record<RecurringBookingResponse['status'], { label: string; color: string; icon: string }> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    color: colors.feedback.success,
    icon: 'checkmark-circle',
  },
  PAUSED: {
    label: 'Tạm dừng',
    color: colors.feedback.warning,
    icon: 'pause',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: colors.feedback.error,
    icon: 'close-circle',
  },
};

const getRecurrenceLabel = (booking: RecurringBookingResponse) => {
  if (booking.recurrenceTypeDisplay) {
    return booking.recurrenceTypeDisplay;
  }
  switch (booking.recurrenceType) {
    case 'WEEKLY':
      return 'Hàng tuần';
    case 'MONTHLY':
      return 'Hàng tháng';
    default:
      return 'Định kỳ';
  }
};

const formatDays = (booking: RecurringBookingResponse) => {
  if (booking.recurrenceDaysDisplay) {
    return booking.recurrenceDaysDisplay;
  }

  if (!Array.isArray(booking.recurrenceDays)) {
    return 'Không rõ ngày';
  }

  const weekdayMap: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    7: 'Chủ nhật',
  };

  return booking.recurrenceDays.map((day) => weekdayMap[day] ?? `Ngày ${day}`).join(', ');
};

const formatTime = (time?: string) => {
  if (!time) return 'Không rõ giờ';
  if (time.includes(':')) {
    return time.slice(0, 5);
  }
  return time;
};

const formatDate = (value?: string) => {
  if (!value) return 'Không rõ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const RecurringBookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  useEnsureValidToken();
  const { userInfo } = useUserInfo();
  const { user } = useAuth();

  const customerId = useMemo(() => {
    if (userInfo?.id) return userInfo.id;
    if (user && 'customerId' in user) {
      return (user as any).customerId;
    }
    return undefined;
  }, [userInfo, user]);

  const [bookings, setBookings] = useState<RecurringBookingResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(
    async (pageToLoad = 0, append = false) => {
      if (!customerId) {
        setLoading(false);
        setBookings([]);
        setError('Không tìm thấy thông tin khách hàng');
        return;
      }

      try {
        if (!append) {
          setError(null);
        }

        const response = await recurringBookingService.getRecurringBookings(customerId, {
          page: pageToLoad,
          size: PAGE_SIZE,
        });

        setBookings((prev) => (append ? [...prev, ...response.data] : response.data));
        setPage(response.currentPage ?? pageToLoad);
        setTotalPages(response.totalPages ?? 1);
      } catch (err: any) {
        console.error('Failed to load recurring bookings', err);
        if (!append) {
          setError(err?.message || 'Không thể tải danh sách');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [customerId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings(0, false);
  }, [fetchBookings]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || page + 1 >= totalPages) return;
    setLoadingMore(true);
    fetchBookings(page + 1, true);
  }, [fetchBookings, loading, loadingMore, page, totalPages]);

  const handleNavigateDetail = (bookingId: string) => {
    navigation.navigate('RecurringBookingDetail', { recurringBookingId: bookingId });
  };

  const renderCard = ({ item }: { item: RecurringBookingResponse }) => {
    const statusMeta = STATUS_META[item.status];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => handleNavigateDetail(item.recurringBookingId)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.title || 'Lịch định kỳ'}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.customerName || item.customer?.fullName || 'Khách hàng'}
            </Text>
          </View>
          {statusMeta && (
            <View style={[styles.statusBadge, { backgroundColor: `${statusMeta.color}15` }] }>
              <Ionicons name={statusMeta.icon as any} size={16} color={statusMeta.color} />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="repeat-outline" size={18} color={colors.highlight.teal} />
          <Text style={styles.infoText}>{getRecurrenceLabel(item)} · {formatDays(item)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={colors.highlight.teal} />
          <Text style={styles.infoText}>
            {formatTime(item.bookingTime)} · Bắt đầu {formatDate(item.startDate)}
            {item.endDate ? ` · Kết thúc ${formatDate(item.endDate)}` : ''}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={colors.highlight.teal} />
          <Text style={styles.infoText} numberOfLines={2}>
            {item.address?.fullAddress || 'Chưa có địa chỉ'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Đã tạo</Text>
            <Text style={styles.statValue}>{item.totalGeneratedBookings ?? '--'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sắp tới</Text>
            <Text style={styles.statValue}>{item.upcomingBookings ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletons = () => (
    <View style={styles.skeletonWrapper}>
      {[1, 2, 3].map((item) => (
        <SkeletonPlaceholder key={item} height={160} style={styles.skeletonCard} />
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="calendar-clear-outline" size={32} color={colors.highlight.teal} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có lịch định kỳ</Text>
      <Text style={styles.emptyDescription}>
        Bắt đầu với lịch định kỳ để tự động hóa việc đặt dịch vụ bạn yêu thích.
      </Text>
      <Button
        title="Đặt lịch ngay"
        onPress={() => navigation.navigate('Booking')}
        fullWidth
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch định kỳ</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.recurringBookingId}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListHeaderComponent={loading ? renderSkeletons : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: responsiveSpacing.md }} color={colors.highlight.teal} />
          ) : null
        }
      />

      {error && !loading && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color={colors.feedback.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: responsiveFontSize.heading2,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  listContent: {
    paddingHorizontal: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.xxl,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  cardTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  cardSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  statusText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveSpacing.sm,
    gap: responsiveSpacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: responsiveSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.border,
  },
  statItem: {
    flex: 1,
    paddingVertical: responsiveSpacing.md,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral.border,
    marginVertical: responsiveSpacing.md,
  },
  statLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  statValue: {
    fontSize: responsiveFontSize.heading3,
    color: colors.primary.navy,
    fontWeight: '600',
    marginTop: 4,
  },
  skeletonWrapper: {
    paddingVertical: responsiveSpacing.md,
    gap: responsiveSpacing.md,
  },
  skeletonCard: {
    borderRadius: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: responsiveSpacing.xl,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.highlight.teal}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveSpacing.md,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  errorBanner: {
    position: 'absolute',
    bottom: responsiveSpacing.md,
    left: responsiveSpacing.md,
    right: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  errorText: {
    flex: 1,
    color: colors.feedback.error,
    fontSize: responsiveFontSize.body,
  },
  retryText: {
    color: colors.primary.navy,
    fontWeight: '600',
  },
});

export default RecurringBookingsScreen;
