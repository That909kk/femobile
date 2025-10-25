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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../hooks/useAuth';
import { serviceService } from '../../../services/serviceService';
import { employeeScheduleService } from '../../../services/employeeScheduleService';
import { colors, typography, spacing, responsive, screenDimensions, responsiveSpacing, responsiveFontSize, getGridItemWidth } from '../../../styles';
import { Service, Employee } from '../../../types';

interface CustomerHomeScreenProps {}

const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [featuredEmployees, setFeaturedEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setServices(response.data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadFeaturedEmployees = async () => {
    try {
      const response = await employeeScheduleService.getAvailableEmployees({
        status: 'AVAILABLE',
        limit: 4
      });
      setFeaturedEmployees(response.data || []);
    } catch (error) {
      console.error('Error loading featured employees:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleServicePress = (service: Service) => {
    navigation.navigate('ServiceDetail', { serviceId: service.id });
  };

  const handleEmployeePress = (employee: Employee) => {
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
              uri: user?.avatar || 'https://picsum.photos/40/40?random=1' 
            }}
            style={styles.avatar}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Xin chào</Text>
            <Text style={styles.userName}>{user?.name || 'Khách hàng'}</Text>
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
            color={colors.neutral.white} 
          />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>
            Khám phá và trải nghiệm các dịch vụ gia đình ngay hôm nay.
          </Text>
          <View style={styles.pointsContainer}>
            <View style={styles.pointsItem}>
              <Ionicons name="wallet-outline" size={16} color={colors.highlight.teal} />
              <Text style={styles.pointsText}>0 ₫</Text>
            </View>
            <View style={styles.pointsItem}>
              <Ionicons name="star" size={16} color={colors.feedback.warning} />
              <Text style={styles.pointsText}>0 Points</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPromoBanner = () => (
    <View style={styles.promoBanner}>
      <Image
        source={{ uri: 'https://picsum.photos/320/160?random=promo' }}
        style={styles.promoImage}
        resizeMode="cover"
      />
      <View style={styles.promoOverlay}>
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>GIẢM GIÁ ĐẶC BIỆT</Text>
          <Text style={styles.promoSubtitle}>15.000.000</Text>
          <Text style={styles.promoDescription}>CHO THÁNG 1.000.000</Text>
        </View>
      </View>
      <View style={styles.promoDots}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <View
            key={index}
            style={[
              styles.promoDot,
              index === 2 && styles.promoDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity
      key={service.id}
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
      <Text style={styles.servicePrice}>
        {service.basePrice ? `${service.basePrice.toLocaleString()}₫` : 'Liên hệ'}
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
      
      <View style={styles.serviceGrid}>
        {services.slice(0, 8).map((service) => renderServiceCard(service))}
      </View>
    </View>
  );

  const renderEmployeeCard = (employee: Employee) => (
    <TouchableOpacity
      key={employee.id}
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
            {employee.rating?.toFixed(1) || '5.0'}
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
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.employeeList}
      >
        {featuredEmployees.map((employee) => renderEmployeeCard(employee))}
      </ScrollView>
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
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rewardsList}
      >
        <View style={styles.rewardCard}>
          <Image
            source={{ uri: 'https://picsum.photos/200/120?random=reward1' }}
            style={styles.rewardImage}
          />
          <View style={styles.rewardContent}>
            <Text style={styles.rewardTitle} numberOfLines={2}>
              Voucher 100.000₫ cho hóa đơn từ 500.000₫ tại Le Monde Steak
            </Text>
            <Text style={styles.rewardProvider}>Le Monde Steak</Text>
            <View style={styles.rewardPoints}>
              <Ionicons name="star" size={16} color={colors.feedback.warning} />
              <Text style={styles.rewardPointsText}>50</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
    paddingRight: 0, // Bỏ padding right để tránh conflict với margin của button
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.highlight.teal,
    borderRadius: responsive.moderateScale(24),
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: responsiveSpacing.sm, // Thêm margin để tránh bị cắt
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
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginLeft: responsiveSpacing.xs,
    fontWeight: '500',
  },
  
  // Promo Banner
  promoBanner: {
    margin: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(16),
    overflow: 'hidden',
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: responsive.verticalScale(160),
  },
  promoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 28, 45, 0.3)',
    justifyContent: 'center',
    paddingLeft: responsiveSpacing.lg,
  },
  promoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.white,
    fontWeight: '600',
    marginBottom: responsiveSpacing.xs,
  },
  promoSubtitle: {
    fontSize: responsiveFontSize.heading2,
    color: colors.neutral.white,
    fontWeight: 'bold',
    marginBottom: responsiveSpacing.xs,
  },
  promoDescription: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.white,
  },
  promoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.sm,
    position: 'absolute',
    bottom: responsiveSpacing.sm,
    left: 0,
    right: 0,
  },
  promoDot: {
    width: responsive.moderateScale(6),
    height: responsive.moderateScale(6),
    borderRadius: responsive.moderateScale(3),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: responsive.moderateScale(3),
  },
  promoDotActive: {
    backgroundColor: colors.highlight.teal,
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
  rewardsList: {
    paddingRight: responsiveSpacing.md,
  },
  rewardCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(12),
    overflow: 'hidden',
    width: responsive.moderateScale(screenDimensions.isSmallScreen ? 220 : 240),
    marginRight: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(2) },
    shadowOpacity: 0.08,
    shadowRadius: responsive.moderateScale(8),
    elevation: 2,
  },
  rewardImage: {
    width: '100%',
    height: responsive.verticalScale(100),
  },
  rewardContent: {
    padding: responsiveSpacing.sm,
  },
  rewardTitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
    marginBottom: responsiveSpacing.xs,
    lineHeight: responsiveFontSize.caption * 1.3,
  },
  rewardProvider: {
    fontSize: responsiveFontSize.caption - 1,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.xs,
  },
  rewardPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardPointsText: {
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.warning,
    fontWeight: '600',
    marginLeft: responsiveSpacing.xs,
  },
});

export default CustomerHomeScreen;
