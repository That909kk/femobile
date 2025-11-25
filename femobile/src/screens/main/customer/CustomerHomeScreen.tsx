import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../hooks/useAuth';
import { useNotificationStore } from '../../../store/notificationStore';
import { serviceService } from '../../../services/serviceService';
import { employeeScheduleService } from '../../../services/employeeScheduleService';
import { bookingService } from '../../../services';
import { colors, responsive, screenDimensions, responsiveSpacing, responsiveFontSize, getGridItemWidth } from '../../../styles';
import { Service, Employee } from '../../../types';

interface CustomerHomeScreenProps {}

const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const getUnreadCount = useNotificationStore(state => state.getUnreadCount);
  const [services, setServices] = useState<Service[]>([]);
  const userAvatar = user && 'avatar' in user ? user.avatar : undefined;
  const userFullName = user?.fullName ?? user?.username ?? 'Khách hàng';
  const [featuredEmployees, setFeaturedEmployees] = useState<Employee[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannersLoaded, setBannersLoaded] = useState<boolean[]>([false, false, false]);
  const [bookingStats, setBookingStats] = useState<{
    totalCompleted: number;
    totalUpcoming: number;
    totalInProgress: number;
  }>({
    totalCompleted: 0,
    totalUpcoming: 0,
    totalInProgress: 0,
  });

  // Animation cho Voice Booking button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Tạo animation pulse cho nút
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Tạo animation glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const mapServiceFromApi = (item: any): Service => {
    const rawId = item?.serviceId ?? item?.id;

    return {
      id: rawId ? String(rawId) : '',
      name: item?.name ?? 'Dịch vụ chưa cập nhật',
      description: item?.description,
      basePrice: typeof item?.basePrice === 'number' ? item.basePrice : undefined,
      duration: typeof item?.estimatedDurationHours === 'number' ? item.estimatedDurationHours : undefined,
      image: item?.iconUrl ?? undefined,
      categoryId: item?.categoryId ? String(item.categoryId) : undefined,
      isNew: Boolean(item?.isNew),
      isActive: Boolean(item?.isActive ?? true),
      createdAt: item?.createdAt ?? '',
      updatedAt: item?.updatedAt ?? '',
    };
  };

  const mapEmployeeFromApi = (item: any): Employee => {
    const rawId = item?.employeeId ?? item?.id;

    return {
      employeeId: rawId ? String(rawId) : '',
      username: item?.username ?? '',
      fullName: item?.fullName ?? item?.name ?? 'Nhân viên chưa cập nhật',
      email: item?.email ?? '',
      phoneNumber: item?.phoneNumber ?? item?.phone ?? '',
      avatar: item?.avatar ?? undefined,
      isMale: Boolean(item?.isMale),
      status: item?.status ?? 'ACTIVE',
      address: item?.address ?? '',
      rating: item?.rating as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      bio: item?.bio ?? item?.description ?? undefined,
      skills: Array.isArray(item?.skills) ? item.skills : [],
      workZones: item?.workZones ?? item?.workingZones ?? [],
      availability: item?.availability ?? undefined,
    };
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Refresh unread count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[CustomerHomeScreen] 🔔 Screen focused, current unreadCount before fetch:', unreadCount);
      getUnreadCount().then(() => {
        console.log('[CustomerHomeScreen] 🔔 After getUnreadCount, checking store...');
        const freshCount = useNotificationStore.getState().unreadCount;
        console.log('[CustomerHomeScreen] 🔔 Fresh unreadCount from store:', freshCount);
      });
    }, [getUnreadCount]),
  );

  // Debug: Log unreadCount when it changes
  useEffect(() => {
    console.log('[CustomerHomeScreen] 🔔 Unread count:', unreadCount);
  }, [unreadCount]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadServices(),
        loadBookingStatistics(),
        // loadFeaturedEmployees() // Tạm thời tắt - chưa có dữ liệu
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await serviceService.getCustomerServices();

      if (response.success && Array.isArray(response.data)) {
        const mappedServices = response.data.map(mapServiceFromApi);
        setServices(mappedServices);
        setServicesError(null);
      } else {
        setServices([]);
        setServicesError(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
      setServicesError('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const loadBookingStatistics = async () => {
    try {
      // Lấy customerId từ user
      const customerId = user && 'customerId' in user ? (user as any).customerId : undefined;
      
      if (!customerId) {
        console.log('No customerId found, skipping booking statistics');
        return;
      }

      // Lấy ngày hiện tại
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-11
      
      // Ngày đầu tháng: ngày 1 lúc 00:00:00
      const startDate = new Date(year, month, 1, 0, 0, 0);
      
      // Ngày cuối tháng: lấy ngày đầu tháng sau, rồi trừ 1 millisecond
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      // Format theo ISO 8601 (YYYY-MM-DDTHH:mm:ss)
      const formatDate = (date: Date): string => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };
      
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);
      
      console.log('Loading booking statistics for current month:', {
        startDate: startDateStr,
        endDate: endDateStr,
      });

      // Gọi API statistics với timeUnit=MONTH, startDate và endDate
      const response = await bookingService.getBookingStatistics(
        customerId, 
        'MONTH',
        startDateStr,
        endDateStr
      );
      
      console.log('📊 Raw API response:', JSON.stringify(response, null, 2));
      
      // bookingService.getBookingStatistics() đã return response.data
      // Vì vậy response ở đây chính là data: { timeUnit, startDate, endDate, totalBookings, countByStatus }
      // Cast to any để tránh lỗi TypeScript do type definition không khớp
      const data = response as any;
      
      if (data && data.countByStatus) {
        const stats = data.countByStatus;
        const totalBookings = data.totalBookings || 0;
        
        console.log('📊 Count by status:', stats);
        console.log('📊 Total bookings:', totalBookings);
        
        // Tính tổng số đơn sắp diễn ra (PENDING + AWAITING_EMPLOYEE + CONFIRMED)
        const totalUpcoming = (stats.PENDING || 0) + (stats.AWAITING_EMPLOYEE || 0) + (stats.CONFIRMED || 0);
        
        // Số đơn đang thực hiện
        const totalInProgress = stats.IN_PROGRESS || 0;
        
        setBookingStats({
          totalCompleted: totalBookings, // Tổng số đơn đặt
          totalUpcoming,
          totalInProgress,
        });
        
        console.log('📊 ✅ Booking statistics set:', {
          'Tổng số đơn': totalBookings,
          'Sắp diễn ra': totalUpcoming,
          'Đang thực hiện': totalInProgress,
          'Raw stats': stats,
        });
      } else {
        console.warn('📊 ⚠️ No valid stats data found in response:', response);
      }
    } catch (error) {
      console.error('Error loading booking statistics:', error);
      // Không hiển thị lỗi cho user, giữ giá trị mặc định 0
    }
  };

  const loadFeaturedEmployees = async () => {
    try {
      const response = await employeeScheduleService.getAvailableEmployees({
        status: 'AVAILABLE',
        limit: 4
      });
      if (response.success && Array.isArray(response.data)) {
        const mappedEmployees = response.data.map(mapEmployeeFromApi);
        setFeaturedEmployees(mappedEmployees);
        setEmployeesError(null);
      } else {
        setFeaturedEmployees([]);
        setEmployeesError(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error loading featured employees:', error);
      setFeaturedEmployees([]);
      setEmployeesError('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleServicePress = (service: Service) => {
    if (!service.id) {
      return;
    }
    // Navigate to Booking screen with pre-selected service
    navigation.navigate('Booking', { serviceId: service.id });
  };

  const handleEmployeeSelect = (employee: Employee) => {
    if (!employee.employeeId) {
      return;
    }
    navigation.navigate('EmployeePreview', { employeeId: employee.employeeId });
  };

  const handleSeeAllServices = () => {
    navigation.navigate('Booking');
  };

  const handleSeeAllEmployees = () => {
    navigation.navigate('EmployeeList');
  };

  const handleVoiceBooking = () => {
    // TODO: Navigate to Voice Booking screen
    navigation.navigate('VoiceBooking');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: userAvatar || 'https://picsum.photos/40/40?random=1',
            }}
            style={styles.avatar}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Xin chào</Text>
            <Text style={styles.userName}>{userFullName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {
            console.log('[CustomerHomeScreen] 🔔 Notification bell tapped, unreadCount:', unreadCount);
            navigation.navigate('NotificationList');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={responsive.moderateScale(24)}
            color={colors.primary.navy}
          />
          {unreadCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : (
            console.log('[CustomerHomeScreen] 🔔 Badge hidden, unreadCount:', unreadCount) as any
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>
           Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi trong {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}.
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{bookingStats.totalCompleted}</Text>
                <Text style={styles.statLabel}>Tổng số đơn</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{bookingStats.totalUpcoming}</Text>
                <Text style={styles.statLabel}>Sắp diễn ra</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{bookingStats.totalInProgress}</Text>
                <Text style={styles.statLabel}>Đang thực hiện</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const promoBanners = [
    require('../../../assets/images/banner-1.png'),
    require('../../../assets/images/banner-2.png'),
    require('../../../assets/images/banner-3.png'),
  ];

  const handleBannerLoad = (index: number) => {
    setBannersLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const renderPromoBanner = () => (
    <View style={styles.promoBannerContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenDimensions.width - responsive.moderateScale(32)}
        snapToAlignment="center"
        contentContainerStyle={styles.promoBannerContent}
      >
        {promoBanners.map((banner, index) => (
          <TouchableOpacity
            key={`banner-${index}`}
            style={styles.promoBanner}
            activeOpacity={0.9}
          >
            <ExpoImage
              source={banner}
              style={styles.promoBannerImage}
              contentFit="cover"
              transition={300}
              priority={index === 0 ? 'high' : 'normal'}
              cachePolicy="memory-disk"
              onLoadEnd={() => handleBannerLoad(index)}
            />
            {!bannersLoaded[index] && (
              <View style={styles.bannerPlaceholder}>
                <ActivityIndicator size="small" color={colors.highlight.teal} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderServiceCard = (service: Service, index: number) => (
    <TouchableOpacity
      key={service.id || `service-${index}`}
      style={styles.serviceCard}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.85}
    >
      <View style={styles.serviceIconContainer}>
        <Image
          source={{ uri: service.image || 'https://picsum.photos/60/60?random=' + service.id }}
          style={styles.serviceIcon}
        />
        {service.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
      </View>
      <Text style={styles.serviceTitle} numberOfLines={2}>
        {service.name}
      </Text>
    </TouchableOpacity>
  );

  const renderServicesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dịch vụ</Text>
        <TouchableOpacity onPress={handleSeeAllServices}>
          <View style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      {servicesError ? (
        <Text style={styles.errorText}>{servicesError}</Text>
      ) : services.length > 0 ? (
        <View style={styles.serviceGrid}>
          {services.slice(0, 8).map((service, index) => renderServiceCard(service, index))}
        </View>
      ) : (
        <Text style={styles.emptyText}>Không có dữ liệu</Text>
      )}
    </View>
  );

  const renderEmployeeCard = (employee: Employee, index: number) => (
    <TouchableOpacity
      key={employee.employeeId || `employee-${index}`}
      style={styles.employeeCard}
      onPress={() => handleEmployeeSelect(employee)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: employee.avatar || `https://picsum.photos/80/80?random=${employee.employeeId}`
        }}
        style={styles.employeeAvatar}
      />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName} numberOfLines={1}>
          {employee.fullName}
        </Text>
        <View style={styles.employeeRating}>
          <Ionicons name="star" size={12} color={colors.feedback.warning} />
          <Text style={styles.ratingText}>
            {employee.rating 
              ? employee.rating === 'HIGH' 
                ? 'Cao' 
                : employee.rating === 'MEDIUM' 
                ? 'TB' 
                : 'Thấp'
              : 'N/A'
            }
          </Text>
        </View>
        <Text style={styles.employeeSkills} numberOfLines={1}>
          {employee.skills?.join(', ') || 'Đa kỹ năng'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedEmployees = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nhân viên nổi bật</Text>
        <TouchableOpacity onPress={handleSeeAllEmployees}>
          <Text style={styles.seeAllText}>Xem thêm</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.placeholderCard}>
        <Ionicons name="people-outline" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
        <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
      </View>
    </View>
  );

  const renderVoiceBookingButton = () => {
    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    return (
      <View style={styles.voiceBookingContainer}>
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.voiceBookingGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        
        {/* Main button */}
        <Animated.View
          style={[
            styles.voiceBookingButtonWrapper,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.voiceBookingButton}
            onPress={handleVoiceBooking}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1BB5A6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.voiceBookingGradient}
            >
              <View style={styles.voiceBookingContent}>
                <View style={styles.voiceIconContainer}>
                  <Ionicons name="mic" size={responsive.moderateScale(32)} color={colors.neutral.white} />
                  <View style={styles.voiceWave}>
                    <Animated.View
                      style={[
                        styles.waveBar,
                        {
                          opacity: glowOpacity,
                          transform: [
                            {
                              scaleY: glowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1.2],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.voiceTextContainer}>
                  <Text style={styles.voiceBookingTitle}>Đặt lịch bằng giọng nói</Text>
                  <Text style={styles.voiceBookingSubtitle}>Nhanh chóng với AI ✨</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderRewardsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Khuyến mãi</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Xem thêm</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.placeholderCard}>
        <Ionicons name="gift-outline" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
        <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.highlight.teal}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderVoiceBookingButton()}
        {renderPromoBanner()}
        {renderServicesSection()}
        {renderFeaturedEmployees()}
        {renderRewardsSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveSpacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.warm.beige,
    paddingLeft: responsiveSpacing.md,
    paddingRight: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
    paddingBottom: responsiveSpacing.lg,
    overflow: 'visible', // Đảm bảo shadow và các element không bị cắt
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
    paddingRight: responsiveSpacing.xs, // Thêm padding để đảm bảo button không bị cắt
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Cho phép userInfo co giãn nhưng không đẩy button ra ngoài
    marginRight: responsiveSpacing.sm, // Tạo khoảng cách với button
  },
  avatar: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    borderRadius: responsive.moderateScale(20),
    marginRight: responsiveSpacing.sm,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  userName: {
    fontSize: responsiveFontSize.heading3,
    color: colors.primary.navy,
    fontWeight: '600',
  },
  notificationButton: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(24),
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 0, // Không cho nút bị co lại
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: responsive.moderateScale(-4),
    right: responsive.moderateScale(-4),
    minWidth: responsive.moderateScale(18),
    height: responsive.moderateScale(18),
    borderRadius: responsive.moderateScale(9),
    backgroundColor: colors.feedback.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.moderateScale(4),
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  notificationBadgeText: {
    color: colors.neutral.white,
    fontSize: responsive.moderateScale(10),
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // Wallet Card
  walletCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: responsive.moderateScale(16),
    elevation: 4,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    marginBottom: responsiveSpacing.md,
    lineHeight: responsiveFontSize.body * 1.4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.xs,
  },
  statIconContainer: {
    width: responsive.moderateScale(32),
    height: responsive.moderateScale(32),
    borderRadius: responsive.moderateScale(16),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs / 2,
  },
  statLabel: {
    fontSize: responsiveFontSize.caption - 1,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: responsive.moderateScale(40),
    backgroundColor: colors.neutral.border,
    marginHorizontal: responsiveSpacing.xs,
  },
  pointsPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderTextSecondary: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
    marginLeft: responsiveSpacing.xs,
  },
  
  // Promo Banner
  promoBannerContainer: {
    marginVertical: responsiveSpacing.md,
  },
  promoBannerContent: {
    paddingHorizontal: responsiveSpacing.md,
  },
  promoBanner: {
    width: screenDimensions.width - responsive.moderateScale(32),
    height: responsive.moderateScale(160),
    marginRight: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(16),
    overflow: 'hidden',
    backgroundColor: colors.neutral.white,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: responsive.moderateScale(12),
    elevation: 4,
  },
  promoBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.warm.beige,
  },
  
  // Section Styles
  section: {
    marginTop: responsiveSpacing.lg,
    paddingHorizontal: responsiveSpacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.heading2,
    color: colors.primary.navy,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: responsive.moderateScale(44),
    paddingHorizontal: responsiveSpacing.xs,
  },
  seeAllText: {
    fontSize: responsiveFontSize.caption,
    color: colors.highlight.teal,
    fontWeight: '500',
    marginRight: responsiveSpacing.xs,
  },
  errorText: {
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.error,
  },
  emptyText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  
  // Service Grid
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: getGridItemWidth(4, responsiveSpacing.sm),
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
    minHeight: responsive.moderateScale(120),
    padding: responsiveSpacing.xs,
  },
  serviceIconContainer: {
    position: 'relative',
    marginBottom: responsiveSpacing.xs,
  },
  serviceIcon: {
    width: responsive.moderateScale(screenDimensions.isSmallScreen ? 50 : 60),
    height: responsive.moderateScale(screenDimensions.isSmallScreen ? 50 : 60),
    borderRadius: responsive.moderateScale(16),
    backgroundColor: colors.warm.beige,
  },
  serviceTitle: {
    fontSize: screenDimensions.isSmallScreen ? responsiveFontSize.caption - 1 : responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.xs,
    minHeight: responsive.moderateScale(32),
  },
  servicePrice: {
    fontSize: screenDimensions.isSmallScreen ? responsiveFontSize.caption - 2 : responsiveFontSize.caption - 1,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: responsive.moderateScale(-4),
    right: responsive.moderateScale(-4),
    backgroundColor: colors.feedback.error,
    borderRadius: responsive.moderateScale(8),
    paddingHorizontal: responsive.moderateScale(4),
    paddingVertical: responsive.moderateScale(2),
  },
  newBadgeText: {
    fontSize: responsive.moderateScale(8),
    color: colors.neutral.white,
    fontWeight: 'bold',
  },
  
  // Employee List
  employeeList: {
    paddingRight: responsiveSpacing.md,
  },
  employeeCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.sm,
    marginRight: responsiveSpacing.sm,
    width: responsive.moderateScale(screenDimensions.isSmallScreen ? 180 : 200),
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(2) },
    shadowOpacity: 0.08,
    shadowRadius: responsive.moderateScale(8),
    elevation: 2,
  },
  employeeAvatar: {
    width: responsive.moderateScale(50),
    height: responsive.moderateScale(50),
    borderRadius: responsive.moderateScale(25),
    marginRight: responsiveSpacing.sm,
  },
  employeeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    fontWeight: '600',
    marginBottom: responsiveSpacing.xs,
  },
  employeeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.xs,
  },
  ratingText: {
    fontSize: responsiveFontSize.caption - 1,
    color: colors.neutral.textSecondary,
    marginLeft: responsiveSpacing.xs,
  },
  employeeSkills: {
    fontSize: responsiveFontSize.caption - 2,
    color: colors.neutral.textSecondary,
  },
  
  // Rewards Section
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(2) },
    shadowOpacity: 0.08,
    shadowRadius: responsive.moderateScale(8),
    elevation: 2,
  },
  placeholderText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
    marginLeft: responsiveSpacing.sm,
  },

  // Voice Booking Button
  voiceBookingContainer: {
    marginTop: responsiveSpacing.lg,
    marginHorizontal: responsiveSpacing.md,
    alignItems: 'center',
    position: 'relative',
    height: responsive.moderateScale(100),
    justifyContent: 'center',
  },
  voiceBookingGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: responsive.moderateScale(24),
    backgroundColor: colors.highlight.teal,
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: responsive.moderateScale(20),
    elevation: 10,
  },
  voiceBookingButtonWrapper: {
    width: '100%',
  },
  voiceBookingButton: {
    width: '100%',
    borderRadius: responsive.moderateScale(24),
    overflow: 'hidden',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(8) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.moderateScale(16),
    elevation: 8,
  },
  voiceBookingGradient: {
    paddingVertical: responsiveSpacing.lg,
    paddingHorizontal: responsiveSpacing.md,
  },
  voiceBookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconContainer: {
    position: 'relative',
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.md,
  },
  voiceWave: {
    position: 'absolute',
    bottom: responsive.moderateScale(-2),
    left: 0,
    right: 0,
    height: responsive.moderateScale(4),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  waveBar: {
    width: responsive.moderateScale(3),
    height: responsive.moderateScale(12),
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(2),
    marginHorizontal: responsive.moderateScale(1),
  },
  voiceTextContainer: {
    flex: 1,
  },
  voiceBookingTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.neutral.white,
    marginBottom: responsiveSpacing.xs / 2,
  },
  voiceBookingSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});

export default CustomerHomeScreen;
