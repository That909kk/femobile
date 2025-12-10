import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS } from '../../../constants';
import { colors } from '../../../styles';
import {
  workingHoursService,
  type WorkingHours,
  type DayOfWeek,
  DAY_OF_WEEK_LABELS,
  DAY_ORDER,
} from '../../../services/workingHoursService';

interface EditModalState {
  visible: boolean;
  workingHours: WorkingHours | null;
}

export const WorkingHoursScreen: React.FC = () => {
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const ensureValidToken = useEnsureValidToken();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [editModal, setEditModal] = useState<EditModalState>({ visible: false, workingHours: null });
  
  // Edit form state
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [breakEndTime, setBreakEndTime] = useState<Date | null>(null);
  const [hasBreak, setHasBreak] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{
    visible: boolean;
    type: 'start' | 'end' | 'breakStart' | 'breakEnd';
  }>({ visible: false, type: 'start' });

  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

  const loadWorkingHours = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      await ensureValidToken.ensureValidToken();
      const data = await workingHoursService.getWorkingHours(employeeId);
      setWorkingHours(data);
    } catch (error: any) {
      console.error('Error loading working hours:', error);
      // Don't show alert on initial load if no data
      if (workingHours.length > 0) {
        Alert.alert('Lỗi', error.message || 'Không thể tải khung giờ làm việc');
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId, ensureValidToken]);

  useEffect(() => {
    loadWorkingHours();
  }, [loadWorkingHours]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkingHours();
    setRefreshing(false);
  };

  const handleInitializeDefault = async () => {
    if (!employeeId) return;

    Alert.alert(
      'Khởi tạo mặc định',
      'Điều này sẽ tạo khung giờ làm việc mặc định (8:00 - 18:00, nghỉ trưa 12:00 - 13:00). Bạn có muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              setSaving(true);
              await ensureValidToken.ensureValidToken();
              await workingHoursService.initializeDefaultWorkingHours(employeeId);
              await loadWorkingHours();
              Alert.alert('Thành công', 'Đã khởi tạo khung giờ làm việc mặc định');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể khởi tạo khung giờ làm việc');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeToString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openEditModal = (wh: WorkingHours) => {
    setEditModal({ visible: true, workingHours: wh });
    setIsWorkingDay(wh.isWorkingDay);
    setStartTime(parseTimeString(wh.startTime));
    setEndTime(parseTimeString(wh.endTime));
    
    if (wh.breakStartTime && wh.breakEndTime) {
      setHasBreak(true);
      setBreakStartTime(parseTimeString(wh.breakStartTime));
      setBreakEndTime(parseTimeString(wh.breakEndTime));
    } else {
      setHasBreak(false);
      setBreakStartTime(null);
      setBreakEndTime(null);
    }
  };

  const closeEditModal = () => {
    setEditModal({ visible: false, workingHours: null });
    setShowTimePicker({ visible: false, type: 'start' });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowTimePicker({ visible: false, type: 'start' });
      return;
    }

    if (selectedDate) {
      switch (showTimePicker.type) {
        case 'start':
          setStartTime(selectedDate);
          break;
        case 'end':
          setEndTime(selectedDate);
          break;
        case 'breakStart':
          setBreakStartTime(selectedDate);
          break;
        case 'breakEnd':
          setBreakEndTime(selectedDate);
          break;
      }
    }
    setShowTimePicker({ visible: false, type: 'start' });
  };

  const handleSaveWorkingHours = async () => {
    if (!employeeId || !editModal.workingHours) return;

    // Validate times
    if (startTime >= endTime) {
      Alert.alert('Lỗi', 'Giờ bắt đầu phải trước giờ kết thúc');
      return;
    }

    if (hasBreak && breakStartTime && breakEndTime) {
      if (breakStartTime >= breakEndTime) {
        Alert.alert('Lỗi', 'Giờ nghỉ bắt đầu phải trước giờ nghỉ kết thúc');
        return;
      }
      if (breakStartTime <= startTime || breakEndTime >= endTime) {
        Alert.alert('Lỗi', 'Giờ nghỉ phải nằm trong giờ làm việc');
        return;
      }
    }

    try {
      setSaving(true);
      await ensureValidToken.ensureValidToken();

      await workingHoursService.setWorkingHours({
        employeeId,
        dayOfWeek: editModal.workingHours.dayOfWeek,
        startTime: formatTimeToString(startTime),
        endTime: formatTimeToString(endTime),
        isWorkingDay,
        breakStartTime: hasBreak && breakStartTime ? formatTimeToString(breakStartTime) : undefined,
        breakEndTime: hasBreak && breakEndTime ? formatTimeToString(breakEndTime) : undefined,
      });

      await loadWorkingHours();
      closeEditModal();
      Alert.alert('Thành công', 'Đã cập nhật khung giờ làm việc');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật khung giờ làm việc');
    } finally {
      setSaving(false);
    }
  };

  const totalWeeklyHours = workingHoursService.calculateWeeklyHours(workingHours);
  const workingDaysCount = workingHours.filter(wh => wh.isWorkingDay).length;

  const renderWorkingHoursCard = (wh: WorkingHours) => {
    const dailyHours = workingHoursService.calculateDailyHours(wh);

    return (
      <TouchableOpacity
        key={wh.dayOfWeek}
        style={[styles.dayCard, !wh.isWorkingDay && styles.dayCardOff]}
        onPress={() => openEditModal(wh)}
        activeOpacity={0.7}
      >
        <View style={styles.dayCardHeader}>
          <Text style={[styles.dayLabel, !wh.isWorkingDay && styles.dayLabelOff]}>
            {DAY_OF_WEEK_LABELS[wh.dayOfWeek]}
          </Text>
          <View style={[styles.statusBadge, wh.isWorkingDay ? styles.statusBadgeOn : styles.statusBadgeOff]}>
            <Text style={[styles.statusText, wh.isWorkingDay ? styles.statusTextOn : styles.statusTextOff]}>
              {wh.isWorkingDay ? 'Làm việc' : 'Nghỉ'}
            </Text>
          </View>
        </View>

        {wh.isWorkingDay ? (
          <View style={styles.dayCardContent}>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.timeText}>
                {workingHoursService.formatTime(wh.startTime)} - {workingHoursService.formatTime(wh.endTime)}
              </Text>
            </View>

            {wh.breakStartTime && wh.breakEndTime && (
              <View style={styles.timeRow}>
                <Ionicons name="cafe-outline" size={16} color={COLORS.warning} />
                <Text style={styles.breakText}>
                  Nghỉ: {workingHoursService.formatTime(wh.breakStartTime)} - {workingHoursService.formatTime(wh.breakEndTime)}
                </Text>
              </View>
            )}

            <View style={styles.hoursRow}>
              <Text style={styles.hoursText}>{dailyHours.toFixed(1)} giờ</Text>
            </View>
          </View>
        ) : (
          <View style={styles.dayCardContent}>
            <Text style={styles.offText}>Ngày nghỉ</Text>
          </View>
        )}

        <View style={styles.editIcon}>
          <Ionicons name="pencil-outline" size={16} color={COLORS.text.tertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải khung giờ làm việc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary.navy, '#1a3a5c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Khung giờ làm việc</Text>
          <Text style={styles.headerSubtitle}>Cài đặt thời gian làm việc hàng tuần</Text>
        </View>
      </LinearGradient>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>{workingDaysCount}/7</Text>
            <Text style={styles.summaryLabel}>Ngày làm việc</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={24} color={COLORS.success} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>{totalWeeklyHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Giờ/tuần</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {workingHours.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color={COLORS.text.tertiary} />
            <Text style={styles.emptyTitle}>Chưa có khung giờ làm việc</Text>
            <Text style={styles.emptySubtitle}>
              Nhấn nút bên dưới để khởi tạo khung giờ làm việc mặc định
            </Text>
            <TouchableOpacity
              style={styles.initButton}
              onPress={handleInitializeDefault}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.initButtonText}>Khởi tạo mặc định</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.daysContainer}>
            {workingHours.map(renderWorkingHoursCard)}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editModal.workingHours ? DAY_OF_WEEK_LABELS[editModal.workingHours.dayOfWeek] : ''}
            </Text>
            <TouchableOpacity
              onPress={handleSaveWorkingHours}
              style={styles.modalSaveButton}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.modalSaveText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Working Day Toggle */}
            <View style={styles.formSection}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.formLabel}>Ngày làm việc</Text>
                  <Text style={styles.formHint}>Bật nếu bạn làm việc vào ngày này</Text>
                </View>
                <Switch
                  value={isWorkingDay}
                  onValueChange={setIsWorkingDay}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={isWorkingDay ? COLORS.primary : '#f4f3f4'}
                />
              </View>
            </View>

            {isWorkingDay && (
              <>
                {/* Work Hours */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Giờ làm việc</Text>
                  
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker({ visible: true, type: 'start' })}
                  >
                    <Text style={styles.timePickerLabel}>Bắt đầu</Text>
                    <Text style={styles.timePickerValue}>{formatTimeToString(startTime)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker({ visible: true, type: 'end' })}
                  >
                    <Text style={styles.timePickerLabel}>Kết thúc</Text>
                    <Text style={styles.timePickerValue}>{formatTimeToString(endTime)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Break Time */}
                <View style={styles.formSection}>
                  <View style={styles.switchRow}>
                    <View>
                      <Text style={styles.formLabel}>Có thời gian nghỉ</Text>
                      <Text style={styles.formHint}>VD: Nghỉ trưa 12:00 - 13:00</Text>
                    </View>
                    <Switch
                      value={hasBreak}
                      onValueChange={(value) => {
                        setHasBreak(value);
                        if (value && !breakStartTime) {
                          const noon = new Date();
                          noon.setHours(12, 0, 0, 0);
                          setBreakStartTime(noon);
                          const onepm = new Date();
                          onepm.setHours(13, 0, 0, 0);
                          setBreakEndTime(onepm);
                        }
                      }}
                      trackColor={{ false: COLORS.border, true: '#fff3e0' }}
                      thumbColor={hasBreak ? COLORS.warning : '#f4f3f4'}
                    />
                  </View>

                  {hasBreak && (
                    <>
                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => setShowTimePicker({ visible: true, type: 'breakStart' })}
                      >
                        <Text style={styles.timePickerLabel}>Nghỉ từ</Text>
                        <Text style={styles.timePickerValue}>
                          {breakStartTime ? formatTimeToString(breakStartTime) : '--:--'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => setShowTimePicker({ visible: true, type: 'breakEnd' })}
                      >
                        <Text style={styles.timePickerLabel}>Đến</Text>
                        <Text style={styles.timePickerValue}>
                          {breakEndTime ? formatTimeToString(breakEndTime) : '--:--'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {showTimePicker.visible && (
            <DateTimePicker
              value={
                showTimePicker.type === 'start' ? startTime :
                showTimePicker.type === 'end' ? endTime :
                showTimePicker.type === 'breakStart' && breakStartTime ? breakStartTime :
                showTimePicker.type === 'breakEnd' && breakEndTime ? breakEndTime :
                new Date()
              }
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryInfo: {
    marginLeft: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  initButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  initButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardOff: {
    backgroundColor: '#fafafa',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  dayLabelOff: {
    color: COLORS.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOn: {
    backgroundColor: '#e8f5e9',
  },
  statusBadgeOff: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextOn: {
    color: '#4caf50',
  },
  statusTextOff: {
    color: COLORS.text.tertiary,
  },
  dayCardContent: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  breakText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  hoursRow: {
    marginTop: 4,
  },
  hoursText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  offText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  formHint: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  timePickerLabel: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  timePickerValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
});

export default WorkingHoursScreen;
