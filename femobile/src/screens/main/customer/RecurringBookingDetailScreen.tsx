import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Button, SkeletonPlaceholder } from '../../../components';
import { useEnsureValidToken, useUserInfo } from '../../../hooks';
import { recurringBookingService } from '../../../services';
import type { RecurringBookingResponse, RecurringBookingStatus } from '../../../types/recurringBooking';
import type { MainStackParamList } from '../../../types/auth';
import { colors, responsive, responsiveFontSize, responsiveSpacing } from '../../../styles';
import { UI } from '../../../constants';

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

const formatCurrency = (value?: number | null, fallback?: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback || '—';
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const RecurringBookingDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainStackParamList, 'RecurringBookingDetail'>>();
  const { recurringBookingId } = route.params;
  const { userInfo } = useUserInfo();
  useEnsureValidToken();

  const [booking, setBooking] = useState<RecurringBookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);

  const customerId = userInfo?.id;

  const loadDetail = useCallback(async () => {
    if (!customerId || !recurringBookingId) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await recurringBookingService.getRecurringBookingDetail(customerId, recurringBookingId);
      setBooking(response);
    } catch (err: any) {
      console.error('Failed to load recurring booking detail', err);
      setError(err?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [customerId, recurringBookingId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const openCancelModal = () => {
    setCancelReason('');
    setIsCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalVisible(false);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!customerId || !booking) {
      return;
    }

    if (!cancelReason.trim()) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập lý do hủy lịch định kỳ.');
      return;
    }

    setProcessingCancel(true);

    try {
      const response = await recurringBookingService.cancelRecurringBooking(customerId, booking.recurringBookingId, {
        reason: cancelReason.trim(),
      });

      setBooking(response);
      closeCancelModal();
      Alert.alert('Thành công', 'Lịch định kỳ đã được hủy.');
    } catch (err: any) {
      console.error('Failed to cancel recurring booking', err);
      Alert.alert('Lỗi', err?.message || 'Không thể hủy lịch định kỳ. Vui lòng thử lại.');
    } finally {
      setProcessingCancel(false);
    }
  };

  const renderStatusBadge = (status: RecurringBookingStatus) => {
    const meta = STATUS_META[status] || STATUS_META.ACTIVE;
    return (
      <View style={[styles.statusBadge, { backgroundColor: meta.badge }] }>
        <Text style={[styles.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={{ gap: responsiveSpacing.md }}>
      <SkeletonPlaceholder width="70%" height={28} />
      <SkeletonPlaceholder width="40%" height={18} />
      <SkeletonPlaceholder width="100%" height={120} />
      <SkeletonPlaceholder width="100%" height={160} />
      <SkeletonPlaceholder width="100%" height={100} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.primary.navy} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết lịch định kỳ</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderSkeleton()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.container, styles.centered]}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color={STATUS_META.CANCELLED.text} />
          </View>
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button title="Thử lại" onPress={loadDetail} fullWidth />
          <Button title="Quay lại" variant="ghost" onPress={() => navigation.goBack()} fullWidth />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return null;
  }

  const recurrenceDaysText = booking.recurrenceDaysDisplay ||
    (booking.recurrenceDays?.length
      ? booking.recurrenceDays.map((day) => DAY_OF_WEEK_MAP[day] || `Thứ ${day}`).join(', ')
      : 'Chưa chọn ngày');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.primary.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết lịch định kỳ</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle}>{booking.title || 'Lịch định kỳ'}</Text>
              <Text style={styles.bookingSubtitle}>{booking.recurrenceTypeDisplay || (booking.recurrenceType === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng')}</Text>
            </View>
            {renderStatusBadge(booking.status)}
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.highlight.teal} />
            <View style={styles.summaryText}> 
              <Text style={styles.summaryLabel}>Ngày diễn ra</Text>
              <Text style={styles.summaryValue}>{recurrenceDaysText}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={18} color={colors.highlight.teal} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Khung giờ</Text>
              <Text style={styles.summaryValue}>{formatTime(booking.bookingTime)}</Text>
            </View>
          </View>
          <View style={styles.summaryFooter}>
            <View>
              <Text style={styles.summaryLabel}>Bắt đầu</Text>
              <Text style={styles.summaryStat}>{formatDate(booking.startDate)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Kết thúc</Text>
              <Text style={styles.summaryStat}>{booking.endDate ? formatDate(booking.endDate) : 'Không thời hạn'}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Sắp diễn ra</Text>
              <Text style={styles.summaryStat}>{booking.upcomingBookings ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={colors.highlight.teal} />
            <Text style={styles.sectionTitle}>Địa chỉ thực hiện</Text>
          </View>
          <Text style={styles.sectionContent}>
            {booking.address?.fullAddress || 'Chưa cập nhật địa chỉ'}
          </Text>
          <Text style={styles.sectionHint}>
            {booking.address?.ward ? `${booking.address.ward}, ${booking.address.city}` : ''}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={18} color={colors.highlight.teal} />
            <Text style={styles.sectionTitle}>Dịch vụ đi kèm</Text>
          </View>
          <View style={{ gap: responsiveSpacing.sm }}>
            {booking.recurringBookingDetails?.map((detail) => (
              <View key={detail.bookingDetailId} style={styles.serviceCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{detail.service?.name || 'Dịch vụ gia đình'}</Text>
                  <Text style={styles.serviceSubTitle}>Số lượng: {detail.quantity}</Text>
                  {detail.selectedChoices && detail.selectedChoices.length > 0 && (
                    <Text style={styles.choiceText}>
                      Tuỳ chọn: {detail.selectedChoices.map((choice) => choice.choiceName).join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={styles.servicePrice}>
                  {detail.formattedSubTotal || formatCurrency(detail.subTotal)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {(booking.note || booking.cancellationReason) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.highlight.teal} />
              <Text style={styles.sectionTitle}>Ghi chú</Text>
            </View>
            {booking.note ? (
              <Text style={styles.sectionContent}>{booking.note}</Text>
            ) : null}
            {booking.cancellationReason ? (
              <View style={styles.cancellationBox}>
                <Text style={styles.sectionLabel}>Lý do hủy</Text>
                <Text style={styles.sectionContent}>{booking.cancellationReason}</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={18} color={colors.highlight.teal} />
            <Text style={styles.sectionTitle}>Thông tin thêm</Text>
          </View>
          <View style={styles.infoGrid}>
            <View>
              <Text style={styles.sectionLabel}>Đã tạo</Text>
              <Text style={styles.sectionContent}>{booking.totalGeneratedBookings ?? 0} lần</Text>
            </View>
            <View>
              <Text style={styles.sectionLabel}>Tạo ngày</Text>
              <Text style={styles.sectionContent}>{formatDate(booking.createdAt)}</Text>
            </View>
            <View>
              <Text style={styles.sectionLabel}>Cập nhật</Text>
              <Text style={styles.sectionContent}>{formatDate(booking.updatedAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={18} color={colors.highlight.teal} />
            <Text style={styles.sectionTitle}>Tổng chi phí ước tính</Text>
          </View>
          <Text style={styles.sectionContent}>
            {booking.recurringBookingDetails?.length
              ? booking.recurringBookingDetails
                  .map((detail) => detail.subTotal || 0)
                  .reduce((sum, value) => sum + value, 0)
                  .toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
              : '—'}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {booking.status !== 'CANCELLED' && (
            <Button title="Hủy lịch định kỳ" variant="outline" onPress={openCancelModal} fullWidth />
          )}
          <Button title="Đặt lịch khác" onPress={() => navigation.navigate('Booking')} fullWidth />
        </View>
      </ScrollView>

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
              Vui lòng nhập lý do để chúng tôi cải thiện dịch vụ.
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

export default RecurringBookingDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  container: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.xxl,
    paddingTop: responsiveSpacing.lg,
    gap: responsiveSpacing.lg,
  },
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  summaryCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: UI.BORDER_RADIUS.xl,
    padding: responsiveSpacing.lg,
    gap: responsiveSpacing.md,
    ...UI.SHADOW.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSpacing.sm,
  },
  bookingTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  bookingSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
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
  summaryRow: {
    flexDirection: 'row',
    gap: responsiveSpacing.sm,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  summaryValue: {
    fontSize: responsiveFontSize.bodyLarge,
    color: colors.neutral.textSecondary,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.xs,
  },
  section: {
    backgroundColor: colors.neutral.white,
    borderRadius: UI.BORDER_RADIUS.large,
    padding: responsiveSpacing.lg,
    gap: responsiveSpacing.sm,
    ...UI.SHADOW.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  sectionContent: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    lineHeight: 22,
  },
  sectionHint: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  sectionLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.border,
  },
  serviceTitle: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  serviceSubTitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  choiceText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  cancellationBox: {
    marginTop: responsiveSpacing.sm,
    padding: responsiveSpacing.sm,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: 'rgba(214,69,69,0.08)',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionGroup: {
    marginTop: responsiveSpacing.sm,
    gap: responsiveSpacing.sm,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveSpacing.md,
    ...UI.SHADOW.small,
  },
  errorTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.lg,
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
