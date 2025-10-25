import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS } from '../../../constants';
import { 
  employeeScheduleService, 
  type EmployeeSchedule, 
  type ScheduleStatus,
  type ScheduleStats
} from '../../../services';

export const ScheduleScreen = () => {
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats>({
    totalJobs: 0,
    completedJobs: 0,
    inProgressJobs: 0,
    todayRevenue: 0
  });
  
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  // Load schedule data
  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const [scheduleData, statsData] = await Promise.all([
        employeeScheduleService.getScheduleByDate(selectedDate),
        employeeScheduleService.getScheduleStats()
      ]);

      setSchedules(scheduleData);
      
      // Handle case when statsData is null
      if (statsData) {
        setStats(statsData);
      } else {
        console.warn('Stats data is null, using default values');
        setStats({
          totalJobs: 0,
          completedJobs: 0,
          inProgressJobs: 0,
          todayRevenue: 0
        });
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      setSchedules([]);
      setStats({
        totalJobs: 0,
        completedJobs: 0,
        inProgressJobs: 0,
        todayRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Load data on mount and when date changes
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const generateWeekDates = () => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = generateWeekDates();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatTime = (timeStr: string): string => {
    // Assume timeStr is in HH:mm format or ISO string
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return timeStr;
  };

  const getStatusColor = (status: ScheduleStatus) => {
    switch (status) {
      case 'scheduled':
        return COLORS.warning;
      case 'in-progress':
        return COLORS.secondary;
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.text.tertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Đã lên lịch';
      case 'in-progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'time-outline';
      case 'in-progress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const handleScheduleAction = async (scheduleId: string, action: string) => {
    try {
      switch (action) {
        case 'start':
          Alert.alert(
            'Bắt đầu công việc',
            'Xác nhận bắt đầu thực hiện công việc này?',
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Bắt đầu', 
                onPress: async () => {
                  try {
                    await employeeScheduleService.startWork(scheduleId);
                    Alert.alert('Thành công', 'Đã bắt đầu công việc');
                    loadSchedule(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể bắt đầu công việc');
                  }
                }
              },
            ]
          );
          break;
        case 'complete':
          Alert.alert(
            'Hoàn thành công việc',
            'Xác nhận bạn đã hoàn thành công việc này?',
            [
              { text: 'Chưa xong', style: 'cancel' },
              { 
                text: 'Hoàn thành', 
                onPress: async () => {
                  try {
                    await employeeScheduleService.completeWork(scheduleId);
                    Alert.alert('Thành công', 'Đã hoàn thành công việc');
                    loadSchedule(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể hoàn thành công việc');
                  }
                }
              },
            ]
          );
          break;
        case 'cancel':
          Alert.alert(
            'Hủy công việc',
            'Bạn có chắc chắn muốn hủy công việc này không?',
            [
              { text: 'Không', style: 'cancel' },
              { 
                text: 'Hủy', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    await employeeScheduleService.cancelWork(scheduleId);
                    Alert.alert('Thành công', 'Đã hủy công việc');
                    loadSchedule(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể hủy công việc');
                  }
                }
              },
            ]
          );
          break;
        case 'call':
          // In a real app, this would initiate a phone call
          console.log('Call customer for schedule:', scheduleId);
          break;
        case 'navigate':
          // In a real app, this would open maps/navigation
          console.log('Navigate to customer address:', scheduleId);
          break;
        default:
          console.log(action, scheduleId);
      }
    } catch (error) {
      console.error('Error handling schedule action:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const renderScheduleItem = (item: EmployeeSchedule) => (
    <View key={item.scheduleId} style={styles.scheduleCard}>
      {item.isUrgent && (
        <View style={styles.urgentBanner}>
          <Ionicons name="warning" size={16} color={COLORS.surface} />
          <Text style={styles.urgentText}>Ưu tiên cao</Text>
        </View>
      )}

      <View style={styles.scheduleHeader}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={14} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.scheduleContent}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="card" size={16} color={COLORS.text.tertiary} />
          <Text style={[styles.detailText, styles.priceText]}>{formatPrice(item.price)}</Text>
        </View>

        {item.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color={COLORS.text.tertiary} />
            <Text style={styles.detailText}>{item.notes}</Text>
          </View>
        )}

        {item.status === 'in-progress' && item.completionPercent && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>Tiến độ: {item.completionPercent}%</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${item.completionPercent}%` }
                ]} 
              />
            </View>
          </View>
        )}

        {item.rating && (
          <View style={styles.detailRow}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.detailText}>Đánh giá: {item.rating}/5 sao</Text>
          </View>
        )}

        {item.completedAt && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.detailText}>Hoàn thành lúc: {formatTime(item.completedAt)}</Text>
          </View>
        )}
      </View>

      <View style={styles.scheduleActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleScheduleAction(item.scheduleId, 'call')}
        >
          <Ionicons name="call" size={16} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Gọi</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleScheduleAction(item.scheduleId, 'navigate')}
        >
          <Ionicons name="navigate" size={16} color={COLORS.secondary} />
          <Text style={styles.actionButtonText}>Chỉ đường</Text>
        </TouchableOpacity>

        {item.status === 'scheduled' && (
          <Button
            title="Bắt đầu"
            variant="primary"
            onPress={() => handleScheduleAction(item.scheduleId, 'start')}
          />
        )}

        {item.status === 'in-progress' && (
          <Button
            title="Hoàn thành"
            variant="primary"
            onPress={() => handleScheduleAction(item.scheduleId, 'complete')}
          />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.success, COLORS.primary]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Lịch Làm Việc</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý công việc hàng ngày
            </Text>
          </View>
          <TouchableOpacity style={styles.calendarButton}>
            <Ionicons name="calendar" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.weekContainer}
          contentContainerStyle={styles.weekContent}
        >
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  isSelected && styles.selectedDayCard,
                  isToday && styles.todayCard,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.selectedDayName,
                  isToday && styles.todayText,
                ]}>
                  {weekDays[date.getDay()]}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.selectedDayNumber,
                  isToday && styles.todayText,
                ]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Schedule List */}
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
        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Hôm nay - {selectedDate.toLocaleDateString('vi-VN')}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{stats.totalJobs}</Text>
              <Text style={styles.summaryLabel}>Tổng công việc</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {stats.completedJobs}
              </Text>
              <Text style={styles.summaryLabel}>Hoàn thành</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {stats.inProgressJobs}
              </Text>
              <Text style={styles.summaryLabel}>Đang làm</Text>
            </View>
          </View>
        </View>

        {/* Schedule Items */}
        {schedules.length > 0 ? (
          schedules.map(renderScheduleItem)
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
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
  },
  calendarButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  weekContainer: {
    paddingHorizontal: 20,
  },
  weekContent: {
    paddingBottom: 20,
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedDayCard: {
    backgroundColor: COLORS.surface,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  dayName: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
    marginBottom: 4,
  },
  selectedDayName: {
    color: COLORS.primary,
  },
  todayText: {
    color: COLORS.warning,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  selectedDayNumber: {
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for bottom tab
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
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
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  urgentBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  urgentText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
    marginLeft: 4,
  },
  scheduleHeader: {
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scheduleContent: {
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  priceText: {
    fontWeight: '600',
    color: COLORS.success,
  },
  progressSection: {
    marginVertical: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.text.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});