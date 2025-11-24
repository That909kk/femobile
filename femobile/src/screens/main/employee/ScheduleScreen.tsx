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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import { colors } from '../../../styles';
import { 
  employeeScheduleService,
  type TimeSlot,
  type AssignmentStatus as ScheduleAssignmentStatus,
} from '../../../services';

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
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [datesWithJobs, setDatesWithJobs] = useState<Set<string>>(new Set());
  
  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

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
        console.log('📅 Dates with jobs:', Array.from(datesSet));
        setDatesWithJobs(datesSet);
      }
    } catch (error) {
      console.error('Error loading week schedule:', error);
    }
  }, [employeeId, weekOffset, ensureValidToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadSchedule(),
      loadWeekSchedule()
    ]);
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
    const hasJob = datesWithJobs.has(dateKey);
    
    if (__DEV__ && hasJob) {
      console.log(`✅ Date ${dateKey} has jobs`);
    }
    
    return hasJob;
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

  const handleCheckIn = async (bookingCode: string) => {
    Alert.alert('Thông báo', 'Tính năng check-in đang được phát triển');
  };

  const handleCheckOut = async (bookingCode: string) => {
    Alert.alert('Thông báo', 'Tính năng check-out đang được phát triển');
  };

  const handleCancelAssignment = async (bookingCode: string) => {
    Alert.alert('Thông báo', 'Tính năng hủy công việc đang được phát triển');
  };

  const assignments = timeSlots.filter(slot => slot.type === 'ASSIGNMENT');
  const completedToday = assignments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressToday = assignments.filter((a) => a.status === 'IN_PROGRESS').length;

  const renderTimeSlotCard = (timeSlot: TimeSlot, index: number) => {
    const isActioning = actioningId === timeSlot.bookingCode;
    
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

        <View style={styles.assignmentActions}>
          {isActioning && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}

          {!isActioning && timeSlot.status === 'ASSIGNED' && timeSlot.bookingCode && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelAssignment(timeSlot.bookingCode!)}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.error} />
                <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleCheckIn(timeSlot.bookingCode!)}
              >
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Check-in</Text>
              </TouchableOpacity>
            </>
          )}

          {!isActioning && timeSlot.status === 'IN_PROGRESS' && timeSlot.bookingCode && (
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={() => handleCheckOut(timeSlot.bookingCode!)}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Check-out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Lịch Làm Việc</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý công việc hàng ngày
            </Text>
          </View>
        </View>

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
  assignmentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  loadingIndicator: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.error + '15',
  },
  primaryButton: {
    backgroundColor: colors.highlight.teal,
  },
  successButton: {
    backgroundColor: colors.feedback.success,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});
