import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../../hooks';
import { recurringBookingService } from '../../../../services';
import type { RecurringBookingResponse } from '../../../../types';
import { Button, SkeletonPlaceholder } from '../../../../components';
import { colors, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import type { MainStackParamList } from '../../../../types/auth';

const STATUS_COLORS: Record<RecurringBookingResponse['status'], string> = {
  ACTIVE: colors.feedback.success,
  PAUSED: colors.feedback.warning,
  CANCELLED: colors.feedback.error,
};

const STATUS_LABELS: Record<RecurringBookingResponse['status'], string> = {
  ACTIVE: 'Đang hoạt động',
  PAUSED: 'Tạm dừng',
  CANCELLED: 'Đã hủy',
};

const mapDay = (value: number) => {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[value % 7];
};

const mapDaysDisplay = (booking?: RecurringBookingResponse) => {
  if (!booking) return '';
  if (booking.recurrenceDaysDisplay) return booking.recurrenceDaysDisplay;
  if (Array.isArray(booking.recurrenceDays) && booking.recurrenceDays.length > 0) {
    return booking.recurrenceDays.map(mapDay).join(', ');
  }
  return 'Không rõ ngày';
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '--';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatTime = (time?: string) => {
  if (!time) return 'Không rõ';
  if (time.includes(':')) return time.slice(0, 5);
  return time;
};

const formatDate = (value?: string) => {
  if (!value) return 'Không rõ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const CancelRecurringBookingModal: React.FC<{
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ visible, loading, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) {
      setReason('');
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập lý do hủy lịch định kỳ.');
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Hủy lịch định kỳ</Text>
          <Text style={styles.modalDescription}>
            Hủy lịch sẽ xóa tất cả các booking trong tương lai. Vui lòng cho chúng tôi biết lý do.
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Nhập lý do..."
            value={reason}
            onChangeText={setReason}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.modalActions}>
            <Button
              title="Đóng"
              onPress={onClose}
              variant="outline"
              fullWidth
              disabled={loading}
            />
            <Button
              title="Xác nhận"
              onPress={handleConfirm}
              fullWidth
              loading={loading}
              disabled={!reason.trim() || loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const RecurringBookingDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainStackParamList, 'RecurringBookingDetail'>>();
  const { recurringBookingId } = route.params;

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

  const [booking, setBooking] = useState<RecurringBookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!customerId) {
      setError('Không tìm thấy thông tin khách hàng');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await recurringBookingService.getRecurringBookingDetail(customerId, recurringBookingId);
      setBooking(data);
    } catch (err: any) {
      console.error('Failed to load recurring booking detail', err);
      setError(err?.message || 'Không thể tải chi tiết');
    } finally {
      setLoading(false);
    }
  }, [customerId, recurringBookingId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleCancel = async (reason: string) => {
    if (!customerId || !booking) return;
    try {
      setCancelling(true);
      const updated = await recurringBookingService.cancelRecurringBooking(customerId, booking.recurringBookingId, {
        reason,
      });
      setBooking(updated);
      Alert.alert('Thành công', 'Lịch định kỳ đã được hủy.');
      setCancelModalVisible(false);
    } catch (err: any) {
      console.error('Cancel recurring booking failed', err);
      Alert.alert('Lỗi', err?.message || 'Không thể hủy lịch định kỳ.');
    } finally {
      setCancelling(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary.navy} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết lịch định kỳ</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonWrapper}>
      {[1, 2, 3].map((item) => (
        <SkeletonPlaceholder key={item} height={120} style={styles.skeletonBlock} />
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderSkeleton()}
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.feedback.error} />
          <Text style={styles.emptyTitle}>Không tìm thấy dữ liệu</Text>
          <Text style={styles.emptyDescription}>{error || 'Vui lòng thử lại sau.'}</Text>
          <Button title="Tải lại" onPress={loadDetail} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[booking.status];

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{booking.title || 'Lịch định kỳ'}</Text>
              <Text style={styles.cardSubtitle}>{booking.customerName || booking.customer?.fullName}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}15` }] }>
              <Ionicons name="radio-button-on" size={14} color={statusColor} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{STATUS_LABELS[booking.status]}</Text>
            </View>
          </View>
          <View style={styles.timelineRow}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Bắt đầu</Text>
              <Text style={styles.timelineValue}>{formatDate(booking.startDate)}</Text>
            </View>
            <View style={styles.timelineDivider} />
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Kết thúc</Text>
              <Text style={styles.timelineValue}>{booking.endDate ? formatDate(booking.endDate) : 'Không xác định'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch trình</Text>
          <View style={styles.sectionCard}>
            <View style={styles.detailRow}>
              <Ionicons name="repeat-outline" size={20} color={colors.highlight.teal} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Kiểu định kỳ</Text>
                <Text style={styles.detailValue}>{booking.recurrenceTypeDisplay || booking.recurrenceType}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.highlight.teal} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ngày thực hiện</Text>
                <Text style={styles.detailValue}>{mapDaysDisplay(booking)}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={colors.highlight.teal} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Khung giờ</Text>
                <Text style={styles.detailValue}>{formatTime(booking.bookingTime)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.sectionCard}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={colors.highlight.teal} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Địa chỉ thực hiện</Text>
                <Text style={styles.detailValue}>{booking.address?.fullAddress || 'Chưa cập nhật'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dịch vụ</Text>
          <View style={styles.sectionCard}>
            {booking.recurringBookingDetails?.map((detail) => (
              <View key={detail.bookingDetailId} style={styles.serviceItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{detail.service?.name || 'Dịch vụ'}</Text>
                  <Text style={styles.serviceMeta}>
                    Số lượng: {detail.quantity} · {detail.duration || detail.formattedDuration || '--'}
                  </Text>
                  {detail.selectedChoices && detail.selectedChoices.length > 0 && (
                    <Text style={styles.serviceMeta}>
                      Tuỳ chọn: {detail.selectedChoices.map((choice) => choice.choiceName).join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={styles.servicePrice}>{detail.formattedSubTotal || formatCurrency(detail.subTotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.noteText}>{booking.note || 'Không có ghi chú'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tổng số booking</Text>
              <Text style={styles.statValue}>{booking.totalGeneratedBookings ?? '--'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Sắp diễn ra</Text>
              <Text style={styles.statValue}>{booking.upcomingBookings ?? 0}</Text>
            </View>
          </View>
        </View>

        {booking.status !== 'CANCELLED' && (
          <View style={styles.footerActions}>
            <Button
              title="Hủy lịch định kỳ"
              onPress={() => setCancelModalVisible(true)}
              variant="outline"
              fullWidth
            />
          </View>
        )}
      </ScrollView>

      <CancelRecurringBookingModal
        visible={cancelModalVisible}
        loading={cancelling}
        onClose={() => setCancelModalVisible(false)}
        onSubmit={handleCancel}
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
  scrollContent: {
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
    marginBottom: responsiveSpacing.md,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  statusPillText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveSpacing.sm,
  },
  timelineItem: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  timelineValue: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    fontWeight: '600',
    marginTop: 4,
  },
  timelineDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral.border,
    marginHorizontal: responsiveSpacing.md,
  },
  section: {
    marginTop: responsiveSpacing.lg,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
    gap: responsiveSpacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  detailValue: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    fontWeight: '600',
    marginTop: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: responsiveSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.border,
  },
  serviceName: {
    fontSize: responsiveFontSize.bodyLarge,
    color: colors.primary.navy,
    fontWeight: '600',
  },
  serviceMeta: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: responsiveFontSize.bodyLarge,
    color: colors.highlight.teal,
    fontWeight: '600',
    marginLeft: responsiveSpacing.md,
  },
  noteText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  statValue: {
    fontSize: responsiveFontSize.heading2,
    color: colors.primary.navy,
    fontWeight: '600',
    marginTop: responsiveSpacing.xs,
  },
  footerActions: {
    marginTop: responsiveSpacing.xl,
    marginBottom: responsiveSpacing.xxl,
  },
  skeletonWrapper: {
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.md,
    gap: responsiveSpacing.md,
  },
  skeletonBlock: {
    borderRadius: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSpacing.xl,
    gap: responsiveSpacing.md,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  emptyDescription: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: responsiveSpacing.lg,
    gap: responsiveSpacing.md,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  modalDescription: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  modalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 16,
    padding: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  modalActions: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
  },
});

export default RecurringBookingDetailScreen;
