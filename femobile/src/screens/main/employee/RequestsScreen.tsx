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
  employeeRequestService, 
  type EmployeeRequest, 
  type RequestStatus 
} from '../../../services';

// Define tab status type (subset of RequestStatus)
type TabStatus = 'pending' | 'accepted' | 'completed';

export const RequestsScreen = () => {
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<{
    pending: EmployeeRequest[];
    accepted: EmployeeRequest[];
    completed: EmployeeRequest[];
  }>({
    pending: [],
    accepted: [],
    completed: []
  });
  
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  // Load requests data
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      // Tính năng đang được phát triển - API employeeRequestService sẽ được thay thế
      // bằng availableBookings API trong tương lai
      const [pendingData, acceptedData, completedData] = await Promise.all([
        employeeRequestService.getPendingRequests().catch(() => []),
        employeeRequestService.getAcceptedRequests().catch(() => []),
        employeeRequestService.getCompletedRequests().catch(() => [])
      ]);

      setRequests({
        pending: pendingData,
        accepted: acceptedData,
        completed: completedData
      });
    } catch (error) {
      console.error('Error loading requests:', error);
      // Don't show alert, just show empty state
      setRequests({
        pending: [],
        accepted: [],
        completed: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const requestTabs = [
    { id: 'pending' as TabStatus, label: 'Yêu cầu mới', count: requests.pending.length },
    { id: 'accepted' as TabStatus, label: 'Đã nhận', count: requests.accepted.length },
    { id: 'completed' as TabStatus, label: 'Hoàn thành', count: requests.completed.length },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleRequestAction = async (requestId: string, action: string) => {
    try {
      switch (action) {
        case 'accept':
          Alert.alert(
            'Nhận yêu cầu',
            'Bạn có chắc chắn muốn nhận yêu cầu này không?',
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Nhận', 
                onPress: async () => {
                  try {
                    await employeeRequestService.acceptRequest(requestId);
                    Alert.alert('Thành công', 'Đã nhận yêu cầu thành công');
                    loadRequests(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể nhận yêu cầu này');
                  }
                }
              },
            ]
          );
          break;
        case 'decline':
          Alert.alert(
            'Từ chối yêu cầu',
            'Bạn có chắc chắn muốn từ chối yêu cầu này không?',
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Từ chối', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    await employeeRequestService.declineRequest(requestId);
                    Alert.alert('Thành công', 'Đã từ chối yêu cầu');
                    loadRequests(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể từ chối yêu cầu này');
                  }
                }
              },
            ]
          );
          break;
        case 'call':
          // In a real app, this would initiate a phone call
          break;
        case 'navigate':
          // In a real app, this would open maps/navigation
          break;
        case 'cancel':
          Alert.alert(
            'Hủy yêu cầu',
            'Bạn có chắc chắn muốn hủy yêu cầu đã nhận này không?',
            [
              { text: 'Không', style: 'cancel' },
              { 
                text: 'Hủy', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    await employeeRequestService.cancelRequest(requestId);
                    Alert.alert('Thành công', 'Đã hủy yêu cầu');
                    loadRequests(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể hủy yêu cầu này');
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
                    await employeeRequestService.completeRequest(requestId);
                    Alert.alert('Thành công', 'Đã hoàn thành công việc');
                    loadRequests(); // Reload to update UI
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể hoàn thành yêu cầu này');
                  }
                }
              },
            ]
          );
          break;
        default:
          // Unknown action
          break;
      }
    } catch (error) {
      console.error('Error handling request action:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getPriorityBadge = (isUrgent: boolean) => {
    if (!isUrgent) return null;
    
    return (
      <View style={styles.urgentBadge}>
        <Ionicons name="flash" size={12} color={COLORS.surface} />
        <Text style={styles.urgentText}>Khẩn cấp</Text>
      </View>
    );
  };

  const getDistanceColor = (distance?: number) => {
    if (!distance) return COLORS.text.tertiary;
    if (distance <= 3) return COLORS.success;
    if (distance <= 8) return COLORS.warning;
    return COLORS.error;
  };

  const renderNewRequest = (item: EmployeeRequest) => (
    <View key={item.requestId} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.customerStats}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>{item.customerRating || 'N/A'}</Text>
            <Text style={styles.jobsText}>• {item.customerCompletedJobs || 0} việc</Text>
          </View>
        </View>
        {getPriorityBadge(item.isUrgent)}
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText}>
            {formatDate(item.bookingDate)} • {formatTime(item.bookingTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
        </View>

        {item.distance && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={16} color={getDistanceColor(item.distance)} />
            <Text style={[styles.detailText, { color: getDistanceColor(item.distance) }]}>
              Cách {item.distance} km
            </Text>
          </View>
        )}

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

        <Text style={styles.createdTime}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleRequestAction(item.requestId, 'call')}
        >
          <Ionicons name="call" size={16} color={COLORS.primary} />
          <Text style={styles.callButtonText}>Gọi</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleRequestAction(item.requestId, 'decline')}
        >
          <Text style={styles.declineButtonText}>Từ chối</Text>
        </TouchableOpacity>

        <View style={styles.acceptButton}>
          <Button
            title="Nhận việc"
            variant="primary"
            onPress={() => handleRequestAction(item.requestId, 'accept')}
          />
        </View>
      </View>
    </View>
  );

  const renderAcceptedRequest = (item: EmployeeRequest) => (
    <View key={item.requestId} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.customerStats}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>{item.customerRating || 'N/A'}</Text>
            <Text style={styles.jobsText}>• {item.customerCompletedJobs || 0} việc</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.secondary + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.secondary }]}>Đã nhận</Text>
        </View>
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText}>
            {formatDate(item.bookingDate)} • {formatTime(item.bookingTime)}
          </Text>
        </View>

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

        {item.acceptedAt && (
          <Text style={styles.acceptedTime}>Nhận lúc: {formatDateTime(item.acceptedAt)}</Text>
        )}
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleRequestAction(item.requestId, 'call')}
        >
          <Ionicons name="call" size={16} color={COLORS.primary} />
          <Text style={styles.callButtonText}>Gọi</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.navigateButton]}
          onPress={() => handleRequestAction(item.requestId, 'navigate')}
        >
          <Ionicons name="navigate" size={16} color={COLORS.secondary} />
          <Text style={styles.navigateButtonText}>Chỉ đường</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleRequestAction(item.requestId, 'cancel')}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => handleRequestAction(item.requestId, 'complete')}
        >
          <Text style={styles.completeButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletedRequest = (item: EmployeeRequest) => (
    <View key={item.requestId} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.customerStats}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>{item.customerRating || 'N/A'}/5</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={[styles.statusText, { color: COLORS.success }]}>Hoàn thành</Text>
        </View>
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText}>
            {formatDate(item.bookingDate)} • {formatTime(item.bookingTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="card" size={16} color={COLORS.text.tertiary} />
          <Text style={[styles.detailText, styles.priceText]}>{formatPrice(item.price)}</Text>
        </View>

        {item.notes && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Ghi chú công việc:</Text>
            <Text style={styles.feedbackText}>"{item.notes}"</Text>
          </View>
        )}

        {item.completedAt && (
          <Text style={styles.completedTime}>Hoàn thành lúc: {formatDateTime(item.completedAt)}</Text>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    const currentRequests = requests[activeTab];
    
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="refresh" size={64} color={COLORS.text.tertiary} />
          <Text style={styles.emptyStateTitle}>Đang tải...</Text>
          <Text style={styles.emptyStateSubtitle}>Vui lòng chờ trong giây lát</Text>
        </View>
      );
    }
    
    if (currentRequests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons 
            name={activeTab === 'pending' ? 'list-outline' : activeTab === 'accepted' ? 'time-outline' : 'checkmark-circle-outline'} 
            size={64} 
            color={COLORS.text.tertiary} 
          />
          <Text style={styles.emptyStateTitle}>
            {activeTab === 'pending' ? 'Không có yêu cầu mới' : 
             activeTab === 'accepted' ? 'Chưa có yêu cầu đã nhận' : 
             'Chưa có công việc hoàn thành'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {activeTab === 'pending' ? 'Hiện tại không có yêu cầu công việc mới nào' : 
             activeTab === 'accepted' ? 'Bạn chưa nhận yêu cầu công việc nào' : 
             'Bạn chưa hoàn thành công việc nào'}
          </Text>
        </View>
      );
    }

    return (
      <>
        {activeTab === 'pending' && currentRequests.map(renderNewRequest)}
        {activeTab === 'accepted' && currentRequests.map(renderAcceptedRequest)}
        {activeTab === 'completed' && currentRequests.map(renderCompletedRequest)}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.secondary, COLORS.primary]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Yêu Cầu Công Việc</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý yêu cầu từ khách hàng
            </Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContent}
        >
          {requestTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  activeTab === tab.id && styles.activeTabBadge,
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    activeTab === tab.id && styles.activeTabBadgeText,
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Content */}
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
        {renderContent()}
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
  filterButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabContainer: {
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.surface,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  activeTabBadgeText: {
    color: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for bottom tab
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  customerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 2,
  },
  jobsText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
    marginLeft: 4,
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
  requestContent: {
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
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
  createdTime: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  acceptedTime: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  completedTime: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  earningsText: {
    fontWeight: '600',
    color: COLORS.success,
  },
  feedbackSection: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  requestActions: {
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
  callButton: {
    backgroundColor: COLORS.primary + '10',
  },
  callButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  navigateButton: {
    backgroundColor: COLORS.secondary + '10',
  },
  navigateButtonText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: COLORS.error + '10',
  },
  declineButtonText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: COLORS.error + '10',
  },
  cancelButtonText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: COLORS.success + '10',
  },
  completeButtonText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
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