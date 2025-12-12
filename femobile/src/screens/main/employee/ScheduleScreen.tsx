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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import { colors } from '../../../styles';
import { 
  employeeScheduleService,
  workingHoursService,
  type TimeSlot,
  type AssignmentStatus as ScheduleAssignmentStatus,
  type WorkingHours,
  type DayOfWeek,
  DAY_OF_WEEK_LABELS,
  DAY_ORDER,
} from '../../../services';

type TabType = 'schedule' | 'working-hours';

interface EditFormState {
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  breakStartTime: string;
  breakEndTime: string;
}

export const ScheduleScreen = () => {
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const ensureValidToken = useEnsureValidToken();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tuần hiện tại, -1 = tuần trước, 1 = tuần sau
  const [initialLoading, setInitialLoading] = useState(true); // Loading lần đầu
  const [dateLoading, setDateLoading] = useState(false); // Loading khi đổi ngày
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [datesWithJobs, setDatesWithJobs] = useState<Set<string>>(new Set());
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  
  // Working hours state
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [savingWorkingHours, setSavingWorkingHours] = useState(false);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    startTime: '08:00',
    endTime: '18:00',
    isWorkingDay: true,
    breakStartTime: '12:00',
    breakEndTime: '13:00'
  });
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerField, setTimePickerField] = useState<keyof EditFormState | null>(null);
  const [tempTime, setTempTime] = useState(new Date());
  

  
  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

  // Load working hours
  const loadWorkingHours = useCallback(async () => {
    if (!employeeId) return;
    
    try {
      setWorkingHoursLoading(true);
      await ensureValidToken.ensureValidToken();
      const data = await workingHoursService.getWorkingHours(employeeId);
      setWorkingHours(data);
    } catch (error) {
      console.error('[ScheduleScreen] Error loading working hours:', error);
    } finally {
      setWorkingHoursLoading(false);
    }
  }, [employeeId, ensureValidToken]);

  // Initialize default working hours
  const handleInitializeWorkingHours = async () => {
    if (!employeeId) return;
    
    Alert.alert(
      'Khởi tạo khung giờ mặc định',
      'Bạn có chắc muốn tạo khung giờ làm việc mặc định (Thứ 2 - Thứ 7: 8:00-18:00, nghỉ trưa 12:00-13:00)?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              setSavingWorkingHours(true);
              await ensureValidToken.ensureValidToken();
              const data = await workingHoursService.initializeDefaultWorkingHours(employeeId);
              setWorkingHours(data);
              Alert.alert('Thành công', 'Đã khởi tạo khung giờ làm việc mặc định');
            } catch (error: any) {
              Alert.alert('Lỗi', error?.message || 'Không thể khởi tạo khung giờ làm việc');
            } finally {
              setSavingWorkingHours(false);
            }
          },
        },
      ]
    );
  };

  // Start editing a day
  const startEditingDay = (day: WorkingHours) => {
    setEditingDay(day.dayOfWeek);
    setEditForm({
      startTime: day.startTime?.substring(0, 5) || '08:00',
      endTime: day.endTime?.substring(0, 5) || '18:00',
      isWorkingDay: day.isWorkingDay,
      breakStartTime: day.breakStartTime?.substring(0, 5) || '12:00',
      breakEndTime: day.breakEndTime?.substring(0, 5) || '13:00'
    });
    setEditModalVisible(true);
  };

  // Save working hours changes
  const handleSaveWorkingHours = async () => {
    if (!employeeId || !editingDay) return;
    
    try {
      setSavingWorkingHours(true);
      await ensureValidToken.ensureValidToken();
      
      await workingHoursService.setWorkingHours({
        employeeId,
        dayOfWeek: editingDay,
        startTime: editForm.isWorkingDay ? `${editForm.startTime}:00` : '08:00:00',
        endTime: editForm.isWorkingDay ? `${editForm.endTime}:00` : '18:00:00',
        isWorkingDay: editForm.isWorkingDay,
        breakStartTime: editForm.isWorkingDay ? `${editForm.breakStartTime}:00` : undefined,
        breakEndTime: editForm.isWorkingDay ? `${editForm.breakEndTime}:00` : undefined
      });
      
      await loadWorkingHours();
      setEditModalVisible(false);
      setEditingDay(null);
      Alert.alert('Thành công', 'Đã cập nhật khung giờ làm việc');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật khung giờ làm việc');
    } finally {
      setSavingWorkingHours(false);
    }
  };

  // Time picker helpers
  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeFromDate = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openTimePicker = (field: keyof EditFormState) => {
    const currentTime = editForm[field] as string;
    setTempTime(parseTimeString(currentTime));
    setTimePickerField(field);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate && timePickerField) {
      const timeString = formatTimeFromDate(selectedDate);
      setEditForm(prev => ({ ...prev, [timePickerField]: timeString }));
      if (Platform.OS === 'ios') {
        setTempTime(selectedDate);
      }
    }
  };

  const confirmTimePicker = () => {
    if (timePickerField) {
      const timeString = formatTimeFromDate(tempTime);
      setEditForm(prev => ({ ...prev, [timePickerField]: timeString }));
    }
    setShowTimePicker(false);
    setTimePickerField(null);
  };

  const loadSchedule = useCallback(async (isInitial = false) => {
    if (!employeeId) {
      setInitialLoading(false);
      return;
    }

    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setDateLoading(true);
      }
      
      await ensureValidToken.ensureValidToken();

      const slots = await employeeScheduleService.getScheduleByDate(employeeId, selectedDate);
      
      setTimeSlots(slots || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setTimeSlots([]);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setDateLoading(false);
      }
    }
  }, [employeeId, selectedDate, ensureValidToken]);

  useEffect(() => {
    const isInitial = initialLoading;
    loadSchedule(isInitial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (employeeId) {
      loadSchedule(true);
      loadWorkingHours(); // Load working hours
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Load week schedule to check which dates have jobs
  useEffect(() => {
    loadWeekSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, weekOffset]);

  const loadWeekSchedule = useCallback(async () => {
    if (!employeeId) return;

    try {
      const today = new Date();
      // Tính tuần dựa trên weekOffset
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      await ensureValidToken.ensureValidToken();
      const weekData = await employeeScheduleService.getEmployeeSchedule(
        employeeId,
        weekStart,
        weekEnd
      );

      if (weekData?.timeSlots) {
        const datesSet = new Set<string>();
        weekData.timeSlots.forEach(slot => {
          if (slot.type === 'ASSIGNMENT') {
            // Extract date from ISO string to avoid timezone issues
            // slot.startTime format: "2025-11-04T14:00:00+07:00"
            const dateKey = slot.startTime.split('T')[0]; // Get "2025-11-04"
            datesSet.add(dateKey);
          }
        });
        setDatesWithJobs(datesSet);
      }
    } catch (error) {
      console.error('Error loading week schedule:', error);
    }
  }, [employeeId, weekOffset, ensureValidToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'schedule') {
      await Promise.all([
        loadSchedule(),
        loadWeekSchedule()
      ]);
    } else {
      await loadWorkingHours();
    }
    setRefreshing(false);
  };

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const generateWeekDates = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = generateWeekDates();

  const hasJobsOnDate = (date: Date): boolean => {
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return datesWithJobs.has(dateKey);
  };

  const getStatusColor = (status: ScheduleAssignmentStatus | null) => {
    if (!status) return COLORS.text.tertiary;
    
    switch (status) {
      case 'ASSIGNED':
        return COLORS.warning;
      case 'IN_PROGRESS':
        return COLORS.secondary;
      case 'COMPLETED':
        return COLORS.success;
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.text.tertiary;
    }
  };

  const getStatusText = (status: ScheduleAssignmentStatus | null) => {
    if (!status) return 'N/A';
    
    switch (status) {
      case 'ASSIGNED':
        return 'Đã nhận việc';
      case 'IN_PROGRESS':
        return 'Đang làm';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ScheduleAssignmentStatus | null) => {
    if (!status) return 'information-circle';
    
    switch (status) {
      case 'ASSIGNED':
        return 'time-outline';
      case 'IN_PROGRESS':
        return 'play-circle';
      case 'COMPLETED':
        return 'checkmark-circle';
      case 'CANCELLED':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const assignments = timeSlots.filter(slot => slot.type === 'ASSIGNMENT');
  const completedToday = assignments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressToday = assignments.filter((a) => a.status === 'IN_PROGRESS').length;

  const renderTimeSlotCard = (timeSlot: TimeSlot, index: number) => {
    // Chỉ hiển thị ASSIGNMENT, không hiển thị UNAVAILABLE
    if (timeSlot.type !== 'ASSIGNMENT') {
      return null;
    }

    return (
      <View key={`${timeSlot.bookingCode}-${index}`} style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              {new Date(timeSlot.startTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })} - {new Date(timeSlot.endTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {timeSlot.status && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(timeSlot.status) + '20' }]}>
                <Ionicons 
                  name={getStatusIcon(timeSlot.status) as any} 
                  size={14} 
                  color={getStatusColor(timeSlot.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(timeSlot.status) }]}>
                  {getStatusText(timeSlot.status)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.assignmentContent}>
          <Text style={styles.serviceName}>{timeSlot.serviceName || 'N/A'}</Text>
          <Text style={styles.customerName}>Khách hàng: {timeSlot.customerName || 'N/A'}</Text>
          <Text style={styles.bookingCode}>Mã: #{timeSlot.bookingCode}</Text>
          
          {timeSlot.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={COLORS.text.tertiary} />
              <Text style={styles.detailText} numberOfLines={2}>{timeSlot.address}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={COLORS.text.tertiary} />
            <Text style={styles.detailText}>Thời lượng: {timeSlot.durationHours} giờ</Text>
          </View>

          {timeSlot.reason && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={16} color={COLORS.text.tertiary} />
              <Text style={styles.detailText}>{timeSlot.reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render working hours tab content
  const renderWorkingHoursTab = () => {
    if (workingHoursLoading) {
      return (
        <View style={styles.workingHoursLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải khung giờ làm việc...</Text>
        </View>
      );
    }

    if (workingHours.length === 0) {
      return (
        <View style={styles.emptyWorkingHours}>
          <Ionicons name="time-outline" size={64} color={COLORS.text.tertiary} />
          <Text style={styles.emptyStateTitle}>Chưa có khung giờ làm việc</Text>
          <Text style={styles.emptyStateSubtitle}>
            Nhấn "Khởi tạo mặc định" để tạo khung giờ làm việc tiêu chuẩn
          </Text>
          <TouchableOpacity
            style={[styles.initializeButton, savingWorkingHours && styles.disabledButton]}
            onPress={handleInitializeWorkingHours}
            disabled={savingWorkingHours}
          >
            {savingWorkingHours ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="settings-outline" size={20} color="#fff" />
                <Text style={styles.initializeButtonText}>Khởi tạo mặc định</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.workingHoursContainer}>
        <Text style={styles.workingHoursDescription}>
          Cài đặt khung giờ làm việc cho từng ngày trong tuần. Hệ thống sẽ sử dụng thông tin này để phân công công việc phù hợp.
        </Text>

        {workingHours.map((day) => (
          <TouchableOpacity
            key={day.dayOfWeek}
            style={[
              styles.workingDayCard,
              day.isWorkingDay ? styles.workingDayActive : styles.workingDayInactive
            ]}
            onPress={() => startEditingDay(day)}
            activeOpacity={0.7}
          >
            <View style={styles.workingDayHeader}>
              <View style={[
                styles.workingDayIcon,
                day.isWorkingDay ? styles.workingDayIconActive : styles.workingDayIconInactive
              ]}>
                <Ionicons 
                  name={day.isWorkingDay ? 'checkmark-circle' : 'close-circle'} 
                  size={24} 
                  color="#fff" 
                />
              </View>
              <View style={styles.workingDayInfo}>
                <Text style={styles.workingDayName}>{DAY_OF_WEEK_LABELS[day.dayOfWeek]}</Text>
                <Text style={[
                  styles.workingDayTime,
                  !day.isWorkingDay && styles.workingDayOff
                ]}>
                  {day.isWorkingDay ? (
                    <>
                      {workingHoursService.formatTime(day.startTime)} - {workingHoursService.formatTime(day.endTime)}
                      {day.breakStartTime && day.breakEndTime && (
                        <Text style={styles.breakTimeText}>
                          {' '}(Nghỉ: {workingHoursService.formatTime(day.breakStartTime)} - {workingHoursService.formatTime(day.breakEndTime)})
                        </Text>
                      )}
                    </>
                  ) : (
                    'Nghỉ'
                  )}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={colors.feedback.warning} />
          <View style={styles.infoNoteContent}>
            <Text style={styles.infoNoteTitle}>Lưu ý quan trọng:</Text>
            <Text style={styles.infoNoteText}>• Khung giờ làm việc sẽ ảnh hưởng đến việc phân công công việc</Text>
            <Text style={styles.infoNoteText}>• Hệ thống sẽ tự động thêm 30 phút buffer giữa các công việc</Text>
            <Text style={styles.infoNoteText}>• Slot trong giờ nghỉ trưa sẽ không được đề xuất cho khách hàng</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render edit modal
  const renderEditModal = () => {
    const getTimePickerTitle = () => {
      switch (timePickerField) {
        case 'startTime': return 'Chọn giờ bắt đầu';
        case 'endTime': return 'Chọn giờ kết thúc';
        case 'breakStartTime': return 'Chọn giờ nghỉ trưa bắt đầu';
        case 'breakEndTime': return 'Chọn giờ nghỉ trưa kết thúc';
        default: return 'Chọn giờ';
      }
    };

    return (
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (showTimePicker) {
            setShowTimePicker(false);
          } else {
            setEditModalVisible(false);
            setEditingDay(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Time Picker View - Shows when selecting time */}
            {showTimePicker ? (
              <>
                <View style={styles.timePickerHeader}>
                  <Text style={styles.timePickerTitle}>{getTimePickerTitle()}</Text>
                </View>
                
                <View style={styles.timePickerBody}>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      onChange={handleTimeChange}
                      style={styles.timePicker}
                      textColor={COLORS.text.primary}
                    />
                  ) : (
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      onChange={handleTimeChange}
                      style={styles.timePicker}
                    />
                  )}
                </View>
                
                <View style={styles.timePickerFooter}>
                  <TouchableOpacity
                    style={styles.timePickerCancelButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.timePickerCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timePickerConfirmButton}
                    onPress={confirmTimePicker}
                  >
                    <Text style={styles.timePickerConfirmText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Normal Edit View */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Chỉnh sửa {editingDay ? DAY_OF_WEEK_LABELS[editingDay] : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingDay(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Is Working Day Switch */}
                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Ngày làm việc</Text>
                    <Switch
                      value={editForm.isWorkingDay}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, isWorkingDay: value }))}
                      trackColor={{ false: COLORS.text.tertiary, true: colors.highlight.teal }}
                      thumbColor={editForm.isWorkingDay ? colors.neutral.white : '#f4f3f4'}
                    />
                  </View>

                  {editForm.isWorkingDay && (
                    <>
                      {/* Start Time */}
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Giờ bắt đầu</Text>
                        <TouchableOpacity
                          style={styles.timeInput}
                          onPress={() => openTimePicker('startTime')}
                        >
                          <Ionicons name="time-outline" size={20} color={colors.highlight.teal} />
                          <Text style={styles.timeInputText}>{editForm.startTime}</Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      </View>

                      {/* End Time */}
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Giờ kết thúc</Text>
                        <TouchableOpacity
                          style={styles.timeInput}
                          onPress={() => openTimePicker('endTime')}
                        >
                          <Ionicons name="time-outline" size={20} color={colors.highlight.teal} />
                          <Text style={styles.timeInputText}>{editForm.endTime}</Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      </View>

                      {/* Break Start Time */}
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>
                          <Ionicons name="cafe-outline" size={16} color={COLORS.text.secondary} /> Giờ nghỉ trưa bắt đầu
                        </Text>
                        <TouchableOpacity
                          style={styles.timeInput}
                          onPress={() => openTimePicker('breakStartTime')}
                        >
                          <Ionicons name="time-outline" size={20} color={colors.highlight.teal} />
                          <Text style={styles.timeInputText}>{editForm.breakStartTime}</Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      </View>

                      {/* Break End Time */}
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>
                          <Ionicons name="cafe-outline" size={16} color={COLORS.text.secondary} /> Giờ nghỉ trưa kết thúc
                        </Text>
                        <TouchableOpacity
                          style={styles.timeInput}
                          onPress={() => openTimePicker('breakEndTime')}
                        >
                          <Ionicons name="time-outline" size={20} color={colors.highlight.teal} />
                          <Text style={styles.timeInputText}>{editForm.breakEndTime}</Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingDay(null);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSaveButton, savingWorkingHours && styles.disabledButton]}
                    onPress={handleSaveWorkingHours}
                    disabled={savingWorkingHours}
                  >
                    {savingWorkingHours ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={18} color="#fff" />
                        <Text style={styles.modalSaveButtonText}>Lưu thay đổi</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch làm việc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderEditModal()}
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Lịch Làm Việc</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý công việc và khung giờ làm việc
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'schedule' && styles.tabButtonActive]}
            onPress={() => setActiveTab('schedule')}
          >
            <Ionicons 
              name="calendar-outline" 
              size={18} 
              color={activeTab === 'schedule' ? '#fff' : colors.neutral.textSecondary} 
            />
            <Text style={[styles.tabButtonText, activeTab === 'schedule' && styles.tabButtonTextActive]}>
              Lịch làm việc
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'working-hours' && styles.tabButtonActive]}
            onPress={() => setActiveTab('working-hours')}
          >
            <Ionicons 
              name="settings-outline" 
              size={18} 
              color={activeTab === 'working-hours' ? '#fff' : colors.neutral.textSecondary} 
            />
            <Text style={[styles.tabButtonText, activeTab === 'working-hours' && styles.tabButtonTextActive]}>
              Khung giờ
            </Text>
          </TouchableOpacity>
        </View>

        {/* Week Navigation - Only show on schedule tab */}
        {activeTab === 'schedule' && (
          <>
            <View style={styles.weekNavigation}>
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={() => {
                  setWeekOffset(weekOffset - 1);
                  // Tự động chọn ngày đầu tiên của tuần mới
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + ((weekOffset - 1) * 7));
                  setSelectedDate(newDate);
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.weekLabelButton}
                onPress={() => {
                  setWeekOffset(0);
                  setSelectedDate(new Date());
                }}
              >
                <Text style={styles.weekLabel}>
                  {weekOffset === 0 ? 'Tuần này' : weekOffset > 0 ? `${weekOffset} tuần sau` : `${Math.abs(weekOffset)} tuần trước`}
                </Text>
                {weekOffset !== 0 && (
                  <Text style={styles.weekSubLabel}>Nhấn để về hôm nay</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={() => {
                  setWeekOffset(weekOffset + 1);
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + ((weekOffset + 1) * 7));
                  setSelectedDate(newDate);
                }}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.neutral.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.weekContainer}
              contentContainerStyle={styles.weekContent}
            >
              {weekDates.map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const hasJobs = hasJobsOnDate(date);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCard,
                      isSelected && styles.selectedDayCard,
                      isToday && !isSelected && styles.todayCard,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dayName,
                      isSelected && styles.selectedDayName,
                      isToday && !isSelected && styles.todayText,
                    ]}>
                      {weekDays[date.getDay()]}
                    </Text>
                    <Text style={[
                      styles.dayNumber,
                      isSelected && styles.selectedDayNumber,
                      isToday && !isSelected && styles.todayText,
                    ]}>
                      {date.getDate()}
                    </Text>
                    {hasJobs && (
                      <View style={[
                        styles.jobIndicator,
                        isSelected && styles.jobIndicatorSelected,
                      ]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'schedule' ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {selectedDate.toLocaleDateString('vi-VN')}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{assignments.length}</Text>
                  <Text style={styles.summaryLabel}>Tổng việc</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{completedToday}</Text>
                  <Text style={styles.summaryLabel}>Hoàn thành</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{inProgressToday}</Text>
                  <Text style={styles.summaryLabel}>Đang làm</Text>
                </View>
              </View>
            </View>

            {/* Status Legend */}
            <View style={styles.legendCard}>
              <Text style={styles.legendTitle}>Ghi chú:</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.legendText}>Đã phân công</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
                  <Text style={styles.legendText}>Đang làm</Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.legendText}>Hoàn thành</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.legendText}>Đã hủy</Text>
                </View>
              </View>
            </View>

            {dateLoading ? (
              <View style={styles.dateLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.dateLoadingText}>Đang tải...</Text>
              </View>
            ) : assignments.length > 0 ? (
              timeSlots.map((timeSlot, index) => renderTimeSlotCard(timeSlot, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={COLORS.text.tertiary} />
                <Text style={styles.emptyStateTitle}>Không có lịch làm việc</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Bạn chưa có công việc nào được lên lịch cho ngày này
                </Text>
              </View>
            )}
          </>
        ) : (
          renderWorkingHoursTab()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  headerContainer: {
    backgroundColor: colors.warm.beige,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral.textSecondary,
    marginTop: 4,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  tabButtonActive: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  weekSubLabel: {
    fontSize: 11,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  weekContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  weekContent: {
    gap: 6,
    paddingHorizontal: 4,
  },
  dayCard: {
    width: 48,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  selectedDayCard: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
  },
  todayCard: {
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.highlight.teal,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
    marginBottom: 3,
  },
  selectedDayName: {
    color: colors.neutral.white,
  },
  todayText: {
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral.textPrimary,
  },
  selectedDayNumber: {
    color: colors.neutral.white,
  },
  jobIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.feedback.warning,
    marginTop: 4,
  },
  jobIndicatorSelected: {
    backgroundColor: colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...UI.SHADOW.medium,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.highlight.teal,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  assignmentCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...UI.SHADOW.small,
  },
  assignmentHeader: {
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentContent: {
    gap: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  customerName: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bookingCode: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  priceText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  dateLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  // Legend styles
  legendCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    ...UI.SHADOW.small,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  // Working hours styles
  workingHoursLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkingHours: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  initializeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.highlight.teal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  initializeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  workingHoursContainer: {
    gap: 12,
  },
  workingHoursDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  workingDayCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  workingDayActive: {
    backgroundColor: colors.highlight.teal + '10',
    borderColor: colors.highlight.teal + '30',
  },
  workingDayInactive: {
    backgroundColor: colors.neutral.white,
    borderColor: colors.neutral.border,
  },
  workingDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workingDayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workingDayIconActive: {
    backgroundColor: colors.highlight.teal,
  },
  workingDayIconInactive: {
    backgroundColor: COLORS.text.tertiary,
  },
  workingDayInfo: {
    flex: 1,
  },
  workingDayName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  workingDayTime: {
    fontSize: 13,
    color: colors.highlight.teal,
    marginTop: 2,
  },
  workingDayOff: {
    color: COLORS.error,
  },
  breakTimeText: {
    color: COLORS.text.tertiary,
    fontSize: 12,
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: colors.feedback.warning + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 10,
  },
  infoNoteContent: {
    flex: 1,
  },
  infoNoteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.feedback.warning,
    marginBottom: 4,
  },
  infoNoteText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  timeInputText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.neutral.background,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.highlight.teal,
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Time Picker Modal - Center of screen
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  timePickerContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    ...UI.SHADOW.large,
  },
  timePickerHeader: {
    backgroundColor: colors.highlight.teal,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  timePickerBody: {
    backgroundColor: colors.neutral.white,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timePicker: {
    width: 300,
    height: 200,
  },
  timePickerFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderRightColor: colors.neutral.border,
  },
  timePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight.teal + '10',
    borderLeftWidth: 0.5,
    borderLeftColor: colors.neutral.border,
  },
  timePickerConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
});
