import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, SkeletonPlaceholder } from '../../../components';
import { useEnsureValidToken, useUserInfo } from '../../../hooks';
import { recurringBookingService } from '../../../services';
import type { RecurringBookingResponse, RecurringBookingStatus } from '../../../types/recurringBooking';
import { colors, responsive, responsiveFontSize, responsiveSpacing } from '../../../styles';
import { UI } from '../../../constants';

const PAGE_SIZE = 10;
const DAY_OF_WEEK_MAP: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật',
};

const STATUS_META: Record<RecurringBookingStatus, { label: string; badge: string; text: string }> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    badge: 'rgba(14, 159, 110, 0.12)',
    text: '#0E9F6E',
  },
  PAUSED: {
    label: 'Tạm dừng',
    badge: 'rgba(246, 195, 67, 0.18)',
    text: '#B88700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'rgba(214, 69, 69, 0.15)',
    text: '#D64545',
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('vi-VN');
};

const formatTime = (value?: string | null) => {
  if (!value) return '--:--';
  const segments = value.split(':');
  if (segments.length < 2) return value;
  return `${segments[0]}:${segments[1]}`;
};

const formatCurrency = (value?: number | null, fallback = '—') => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const buildRecurrenceLabel = (booking: RecurringBookingResponse) => {
  const base = booking.recurrenceTypeDisplay || (booking.recurrenceType === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng');
  const days = booking.recurrenceDaysDisplay || (
    booking.recurrenceDays?.length
      ? booking.recurrenceDays
          .map((day) => DAY_OF_WEEK_MAP[day] || `Thứ ${day}`)
          .join(', ')
      : 'Chưa chọn ngày'
  );
  return `${base} • ${days}`;
};

const RecurringBookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userInfo } = useUserInfo();
  useEnsureValidToken();

  const [bookings, setBookings] = useState<RecurringBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RecurringBookingResponse | null>(null);
  const [processingCancel, setProcessingCancel] = useState(false);

  const customerId = userInfo?.id;

  const loadBookings = useCallback(
    async (targetPage: number = 0, append = false) => {
      if (!customerId) {
        return;
      }

      if (targetPage === 0 && !append) {
        setLoading(true);
      }

      try {
        const response = await recurringBookingService.getRecurringBookings(customerId, {
          page: targetPage,
          size: PAGE_SIZE,
        });

        const items = response.data ?? [];

        setBookings((prev) => {
          if (targetPage === 0) {
            return items;
          }

          const existingIds = new Set(prev.map((item) => item.recurringBookingId));
          const merged = [...prev];
          items.forEach((item: RecurringBookingResponse) => {
            if (!existingIds.has(item.recurringBookingId)) {
              merged.push(item);
            }
          });
          return merged;
        });

        setPage(targetPage);
        const totalPages = typeof response.totalPages === 'number' ? response.totalPages : 0;
        setHasMore(targetPage + 1 < totalPages);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load recurring bookings', err);
        setError(err?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
        if (targetPage === 0) {
          setBookings([]);
        }
      } finally {
        if (targetPage === 0) {
          setLoading(false);
          setRefreshing(false);
        } else {
          setFetchingMore(false);
        }
      }
    },
    [customerId],
  );

  useEffect(() => {
    if (customerId) {
      loadBookings(0);
    }
  }, [customerId, loadBookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings(0);
  };

  const handleLoadMore = () => {
    if (loading || fetchingMore || !hasMore) {
      return;
    }
    setFetchingMore(true);
    loadBookings(page + 1, true);
  };

  const openCancelModal = (booking: RecurringBookingResponse) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setIsCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalVisible(false);
    setSelectedBooking(null);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!customerId || !selectedBooking) {
      return;
    }

    if (!cancelReason.trim()) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập lý do hủy lịch định kỳ.');
      return;
    }

    setProcessingCancel(true);

    try {
      const response = await recurringBookingService.cancelRecurringBooking(
        customerId,
        selectedBooking.recurringBookingId,
        {
          reason: cancelReason.trim(),
        },
      );

      const updated = response;
      setBookings((prev) =>
        prev.map((item) =>
          item.recurringBookingId === updated.recurringBookingId ? { ...item, ...updated } : item,
        ),
      );

      closeCancelModal();
      Alert.alert('Thành công', 'Lịch định kỳ đã được hủy.');
    } catch (err: any) {
      console.error('Failed to cancel recurring booking', err);
      Alert.alert('Lỗi', err?.message || 'Không thể hủy lịch định kỳ. Vui lòng thử lại.');
    } finally {
      setProcessingCancel(false);
    }
  };

  const summaryStats = useMemo(() => {
    const active = bookings.filter((booking) => booking.status === 'ACTIVE').length;
    const cancelled = bookings.filter((booking) => booking.status === 'CANCELLED').length;
    const upcomingTotal = bookings.reduce((sum, booking) => sum + (booking.upcomingBookings ?? 0), 0);
    return {
      total: bookings.length,
      active,
      cancelled,
      upcoming: upcomingTotal,
    };
  }, [bookings]);

  const renderStatusBadge = (status: RecurringBookingStatus) => {
    const meta = STATUS_META[status] || STATUS_META.ACTIVE;
    return (
      <View style={[styles.statusBadge, { backgroundColor: meta.badge }] }>
        <Text style={[styles.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
      </View>
    );
  };

  const renderSummaryHeader = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng lịch</Text>
        <Text style={styles.summaryValue}>{summaryStats.total}</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Đang hoạt động</Text>
        <Text style={[styles.summaryValue, { color: STATUS_META.ACTIVE.text }]}>{summaryStats.active}</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Sắp diễn ra</Text>
        <Text style={[styles.summaryValue, { color: colors.highlight.teal }]}>{summaryStats.upcoming}</Text>
      </View>
    </View>
  );

  const renderBookingCard = ({ item }: { item: RecurringBookingResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || item.recurrenceTypeDisplay || 'Lịch định kỳ'}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {buildRecurrenceLabel(item)} • {formatTime(item.bookingTime)}
          </Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.cardRow}>
        <View style={styles.iconBubble}>
          <Ionicons name="calendar-outline" size={18} color={colors.highlight.teal} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Ngày diễn ra</Text>
          <Text style={styles.rowValue} numberOfLines={2}>
            {item.recurrenceDaysDisplay ||
              (item.recurrenceDays?.length
                ? item.recurrenceDays
                    .map((day) => DAY_OF_WEEK_MAP[day] || `Thứ ${day}`)
                    .join(', ')
                : 'Chưa chọn ngày')}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.iconBubble}>
          <Ionicons name="time-outline" size={18} color={colors.highlight.teal} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Khung giờ</Text>
          <Text style={styles.rowValue}>{formatTime(item.bookingTime)}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.iconBubble}>
          <Ionicons name="location-outline" size={18} color={colors.highlight.teal} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Địa chỉ</Text>
          <Text style={styles.rowValue} numberOfLines={2}>
            {item.address?.fullAddress || item.address?.ward || 'Chưa có địa chỉ'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.rowLabel}>Đã tạo</Text>
          <Text style={styles.rowHighlight}>{item.totalGeneratedBookings ?? 0}</Text>
        </View>
        <View>
          <Text style={styles.rowLabel}>Sắp diễn ra</Text>
          <Text style={styles.rowHighlight}>{item.upcomingBookings ?? 0}</Text>
        </View>
        <View>
          <Text style={styles.rowLabel}>Trạng thái</Text>
          <Text style={styles.rowHighlight}>{item.statusDisplay || STATUS_META[item.status]?.label}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('RecurringBookingDetail', {
              recurringBookingId: item.recurringBookingId,
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.highlight.teal} />
          <Text style={styles.actionButtonText}>Chi tiết</Text>
        </TouchableOpacity>
        {item.status !== 'CANCELLED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => openCancelModal(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle-outline" size={18} color={STATUS_META.CANCELLED.text} />
            <Text style={[styles.actionButtonText, { color: STATUS_META.CANCELLED.text }]}>Hủy lịch</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSkeletonList = () => (
    <View style={{ gap: responsiveSpacing.md }}>
      {[0, 1, 2].map((index) => (
        <View key={`skeleton-${index}`} style={styles.card}>
          <SkeletonPlaceholder width="60%" height={24} style={{ marginBottom: responsiveSpacing.xs }} />
          <SkeletonPlaceholder width="40%" height={16} />
          <View style={{ marginTop: responsiveSpacing.md, gap: responsiveSpacing.sm }}>
            <SkeletonPlaceholder width="90%" height={16} />
            <SkeletonPlaceholder width="70%" height={16} />
            <SkeletonPlaceholder width="80%" height={16} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: responsiveSpacing.md }}>
            <SkeletonPlaceholder width="25%" height={20} />
            <SkeletonPlaceholder width="25%" height={20} />
            <SkeletonPlaceholder width="25%" height={20} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-clear-outline" size={32} color={colors.highlight.teal} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có lịch định kỳ</Text>
      <Text style={styles.emptySubtitle}>
        Lên lịch định kỳ giúp bạn tiết kiệm thời gian và luôn giữ nhà cửa sạch sẽ.
      </Text>
      <Button title="Tạo lịch mới" onPress={() => navigation.navigate('Booking')} fullWidth />
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={{ gap: responsiveSpacing.sm }}>
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch định kỳ</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => navigation.navigate('Booking')}>
          <Ionicons name="add-circle-outline" size={24} color={colors.highlight.teal} />
        </TouchableOpacity>
      </View>
      {renderSummaryHeader()}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={() => loadBookings(0)}>
          <Ionicons name="alert-circle-outline" size={18} color={STATUS_META.CANCELLED.text} />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
          <Text style={styles.errorRetry}>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.recurringBookingId}
        contentContainerStyle={[
          styles.listContainer,
          bookings.length === 0 && !loading ? styles.emptyContainer : undefined,
        ]}
        renderItem={renderBookingCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.highlight.teal}
          />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={loading ? renderSkeletonList() : renderEmptyState()}
        ListFooterComponent={
          fetchingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={colors.highlight.teal} />
            </View>
          ) : null
        }
        onEndReachedThreshold={0.2}
        onEndReached={handleLoadMore}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={isCancelModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hủy lịch định kỳ</Text>
            <Text style={styles.modalSubtitle}>
              Vui lòng chia sẻ lý do để chúng tôi cải thiện chất lượng dịch vụ.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do hủy"
              placeholderTextColor={colors.neutral.label}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Button title="Đóng" variant="ghost" onPress={closeCancelModal} fullWidth />
              <Button
                title={processingCancel ? 'Đang xử lý...' : 'Xác nhận hủy'}
                onPress={handleConfirmCancel}
                fullWidth
                loading={processingCancel}
                disabled={processingCancel}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RecurringBookingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  listContainer: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.xxl,
    paddingTop: responsiveSpacing.lg,
    gap: responsiveSpacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveSpacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.SHADOW.small,
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.SHADOW.small,
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: responsiveSpacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: UI.BORDER_RADIUS.large,
    padding: responsiveSpacing.md,
    ...UI.SHADOW.small,
  },
  summaryLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginBottom: responsiveSpacing.xs,
  },
  summaryValue: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    backgroundColor: 'rgba(214, 69, 69, 0.1)',
    borderRadius: UI.BORDER_RADIUS.large,
    padding: responsiveSpacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.primary.navy,
    fontSize: responsiveFontSize.body,
  },
  errorRetry: {
    color: STATUS_META.CANCELLED.text,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: UI.BORDER_RADIUS.large,
    padding: responsiveSpacing.md,
    gap: responsiveSpacing.md,
    ...UI.SHADOW.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSpacing.md,
  },
  cardTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  cardSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.xs / 2,
  },
  statusBadge: {
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs,
    borderRadius: UI.BORDER_RADIUS.full,
  },
  statusBadgeText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  rowValue: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  rowHighlight: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.primary.navy,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.border,
    paddingTop: responsiveSpacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveSpacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSpacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: UI.BORDER_RADIUS.medium,
    paddingVertical: responsiveSpacing.sm,
  },
  actionButtonDanger: {
    borderColor: STATUS_META.CANCELLED.text,
  },
  actionButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.highlight.teal,
  },
  listFooter: {
    paddingVertical: responsiveSpacing.lg,
  },
  emptyState: {
    marginTop: responsiveSpacing.xxl,
    alignItems: 'center',
    gap: responsiveSpacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.SHADOW.small,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  emptySubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    paddingHorizontal: responsiveSpacing.xl,
    marginBottom: responsiveSpacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSpacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: UI.BORDER_RADIUS.large,
    padding: responsiveSpacing.lg,
    gap: responsiveSpacing.md,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  modalSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  modalInput: {
    minHeight: responsive.moderateScale(120),
    borderRadius: UI.BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: responsiveSpacing.md,
    textAlignVertical: 'top',
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  modalActions: {
    flexDirection: 'column',
    gap: responsiveSpacing.sm,
  },
});
