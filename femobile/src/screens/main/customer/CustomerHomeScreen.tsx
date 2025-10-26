import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../hooks/useAuth';
import { serviceService } from '../../../services/serviceService';
import { employeeScheduleService } from '../../../services/employeeScheduleService';
import { colors, responsive, screenDimensions, responsiveSpacing, responsiveFontSize, getGridItemWidth } from '../../../styles';
import { Service, Employee } from '../../../types';

interface CustomerHomeScreenProps {}

const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const userAvatar = user && 'avatar' in user ? user.avatar : undefined;
  const userFullName = user?.fullName ?? user?.username ?? 'Khách hàng';
  const [featuredEmployees, setFeaturedEmployees] = useState<Employee[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannersLoaded, setBannersLoaded] = useState<boolean[]>([false, false, false]);

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
    const ratingValue = Number(item?.rating);
    const rawId = item?.employeeId ?? item?.id;

    return {
      id: rawId ? String(rawId) : '',
      name: item?.fullName ?? item?.name ?? 'Nhân viên chưa cập nhật',
      email: item?.email ?? '',
      phone: item?.phoneNumber ?? item?.phone ?? undefined,
      avatar: item?.avatar ?? undefined,
      skills: Array.isArray(item?.skills) ? item.skills : [],
      rating: Number.isFinite(ratingValue) ? ratingValue : undefined,
      totalReviews: typeof item?.totalReviews === 'number' ? item.totalReviews : undefined,
      isActive: Boolean(item?.status ? item.status !== 'INACTIVE' : true),
      isAvailable: item?.status ? item.status === 'AVAILABLE' : true,
      experience: typeof item?.experienceYears === 'number' ? item.experienceYears : undefined,
      description: item?.description ?? undefined,
      createdAt: item?.createdAt ?? '',
      updatedAt: item?.updatedAt ?? '',
    };
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadServices(),
        loadFeaturedEmployees()
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

  const handleEmployeePress = (employee: Employee) => {
    if (!employee.id) {
      return;
    }
    navigation.navigate('EmployeePreview', { employeeId: employee.id });
  };

  const handleSeeAllServices = () => {
    navigation.navigate('ServiceList');
  };

  const handleSeeAllEmployees = () => {
    navigation.navigate('EmployeeList');
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
          onPress={() => navigation.navigate('NotificationList')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={responsive.moderateScale(24)}
            color={colors.primary.navy}
          />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>
            Khám phá và trải nghiệm các dịch vụ gia đình ngay hôm nay.
          </Text>
          <View style={styles.pointsPlaceholder}>
            <Ionicons name="construct-outline" size={16} color={colors.highlight.teal} />
            <Text style={styles.placeholderTextSecondary}>Tính năng đang phát triển</Text>
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
      key={employee.id || `employee-${index}`}
      style={styles.employeeCard}
      onPress={() => handleEmployeePress(employee)}
      activeOpacity={0.85}
    >
      <Image
        source={{ 
          uri: employee.avatar || `https://picsum.photos/80/80?random=${employee.id}` 
        }}
        style={styles.employeeAvatar}
      />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName} numberOfLines={1}>
          {employee.name}
        </Text>
        <View style={styles.employeeRating}>
          <Ionicons name="star" size={12} color={colors.feedback.warning} />
          <Text style={styles.ratingText}>
            {typeof employee.rating === 'number' ? employee.rating.toFixed(1) : 'N/A'}
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
    top: responsive.moderateScale(8),
    right: responsive.moderateScale(8),
    width: responsive.moderateScale(8),
    height: responsive.moderateScale(8),
    borderRadius: responsive.moderateScale(4),
    backgroundColor: colors.feedback.error,
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
    marginBottom: responsiveSpacing.sm,
    lineHeight: responsiveFontSize.body * 1.4,
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
});

export default CustomerHomeScreen;
