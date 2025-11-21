import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../hooks';
import { COLORS } from '../../constants';
import { userInfoService } from '../../services';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, role, logout } = useAuth();
  const { userInfo, loading: userInfoLoading, error: userInfoError, refetch } = useUserInfo();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleRoleSwitch = (newRole: 'CUSTOMER' | 'EMPLOYEE') => {
    if (newRole === role) return;
    
    Alert.alert(
      'Chuyển đổi vai trò',
      `Bạn có muốn chuyển sang vai trò ${newRole === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên'}? Ứng dụng sẽ được tải lại.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Chuyển đổi', 
          onPress: () => {
            // TODO: Implement role switching logic
            Alert.alert('Thông báo', 'Chức năng chuyển đổi vai trò đang được phát triển');
          }
        },
      ]
    );
  };

  const handleChangeAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0].uri;

      // Check file size (max 5MB)
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const sizeInMB = blob.size / (1024 * 1024);

      if (sizeInMB > 5) {
        Alert.alert(
          'Ảnh quá lớn',
          'Kích thước ảnh không được vượt quá 5MB. Vui lòng chọn ảnh khác.'
        );
        return;
      }

      // Upload avatar
      setUploadingAvatar(true);

      if (!userInfo?.id) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      if (role === 'CUSTOMER') {
        await userInfoService.uploadCustomerAvatar(userInfo.id, imageUri);
      } else if (role === 'EMPLOYEE') {
        await userInfoService.uploadEmployeeAvatar(userInfo.id, imageUri);
      } else {
        throw new Error('Vai trò không hợp lệ');
      }

      // Refresh user info
      await refetch();

      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  const getUserData = () => {
    // Only use real API data - no fallbacks or mock data
    if (!userInfo) {
      return null; // Return null if no API data available
    }

    const baseData = {
      name: userInfo.fullName,
      email: userInfo.email,
      phone: userInfo.phoneNumber,
      avatar: userInfo.avatar,
      role: role,
      // Use birthdate for display
      birthdate: userInfo.birthdate ? 
        new Date(userInfo.birthdate).toLocaleDateString('vi-VN') : 
        null,
      
      // Real data fields from API
      username: userInfo.username,
      accountStatus: userInfo.accountStatus,
      isPhoneVerified: userInfo.isPhoneVerified,
      lastLogin: userInfo.lastLogin ? 
        new Date(userInfo.lastLogin).toLocaleDateString('vi-VN') : 
        null,
      joinedDate: userInfo.createdAt ? 
        new Date(userInfo.createdAt).toLocaleDateString('vi-VN') : 
        null,
      
      // Customer specific fields
      ...(role === 'CUSTOMER' && {
        vipLevel: userInfo.vipLevel,
      }),
      
      // Employee specific fields
      ...(role === 'EMPLOYEE' && {
        hiredDate: userInfo.hiredDate ? 
          new Date(userInfo.hiredDate).toLocaleDateString('vi-VN') : 
          null,
        skills: userInfo.skills || [],
        bio: userInfo.bio,
        employeeStatus: userInfo.employeeStatus,
      }),
      
      // Common rating field
      rating: userInfo.rating,
    };

    return baseData;
  };

  const userData = getUserData();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Chỉnh sửa thông tin',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'change-password',
      title: 'Đổi mật khẩu',
      icon: 'lock-closed-outline',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      id: 'payment-methods',
      title: role === 'CUSTOMER' ? 'Phương thức thanh toán' : 'Thông tin ngân hàng',
      icon: role === 'CUSTOMER' ? 'card-outline' : 'wallet-outline',
      onPress: () => console.log('Payment methods'),
    },
    {
      id: 'addresses',
      title: 'Địa chỉ của tôi',
      icon: 'location-outline',
      onPress: () => console.log('Addresses'),
      visible: role === 'CUSTOMER',
    },
    {
      id: 'work-area',
      title: 'Khu vực làm việc',
      icon: 'map-outline',
      onPress: () => console.log('Work area'),
      visible: role === 'EMPLOYEE',
    },
    {
      id: 'work-schedule',
      title: 'Lịch làm việc',
      icon: 'calendar-outline',
      onPress: () => console.log('Work schedule'),
      visible: role === 'EMPLOYEE',
    },
    {
      id: 'order-history',
      title: 'Lịch sử đơn hàng',
      icon: 'time-outline',
      onPress: () => console.log('Order history'),
      visible: role === 'CUSTOMER',
    },
    {
      id: 'job-history',
      title: 'Lịch sử công việc',
      icon: 'briefcase-outline',
      onPress: () => console.log('Job history'),
      visible: role === 'EMPLOYEE',
    },
    {
      id: 'favorites',
      title: 'Dịch vụ yêu thích',
      icon: 'heart-outline',
      onPress: () => console.log('Favorites'),
      visible: role === 'CUSTOMER',
    },
    {
      id: 'ratings-reviews',
      title: role === 'CUSTOMER' ? 'Đánh giá của tôi' : 'Đánh giá nhận được',
      icon: 'star-outline',
      onPress: () => console.log('Ratings reviews'),
    },
    {
      id: 'support',
      title: 'Hỗ trợ',
      icon: 'help-circle-outline',
      onPress: () => console.log('Support'),
    },
    {
      id: 'terms',
      title: 'Điều khoản sử dụng',
      icon: 'document-text-outline',
      onPress: () => console.log('Terms'),
    },
    {
      id: 'privacy',
      title: 'Chính sách bảo mật',
      icon: 'shield-checkmark-outline',
      onPress: () => console.log('Privacy'),
    },
  ].filter(item => item.visible !== false);

  const getRatingDisplay = () => {
    if (!userData?.rating) return null;
    
    // Both Customer and Employee now use string rating: "HIGH" | "MEDIUM" | "LOW"
    if (typeof userData.rating === 'string') {
      const ratingMap = {
        'HIGH': { text: 'Cao', color: COLORS.success },
        'MEDIUM': { text: 'TB', color: COLORS.warning },
        'LOW': { text: 'Thấp', color: COLORS.error }
      };
      const ratingInfo = ratingMap[userData.rating as 'HIGH' | 'MEDIUM' | 'LOW'];
      return { text: ratingInfo?.text || 'N/A', color: ratingInfo?.color || COLORS.text.secondary };
    }
    
    return null;
  };

  const renderStatsCard = () => {
    if (!userData) return null;
    
    if (role === 'CUSTOMER') {
      const hasStats = userData.vipLevel || userData.rating;
      if (!hasStats) return null;

      const ratingDisplay = getRatingDisplay();
      
      return (
        <View style={styles.statsCard}>
          {userData.vipLevel && (
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.membershipText]}>
                VIP {userData.vipLevel}
              </Text>
              <Text style={styles.statLabel}>Hạng thành viên</Text>
            </View>
          )}
          {ratingDisplay && (
            <>
              {userData.vipLevel && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <View style={styles.ratingContainer}>
                  <Text style={[styles.statNumber, { color: ratingDisplay.color }]}>
                    {ratingDisplay.text}
                  </Text>
                  <Ionicons name="star" size={16} color={ratingDisplay.color} />
                </View>
                <Text style={styles.statLabel}>Uy tín</Text>
              </View>
            </>
          )}
        </View>
      );
    }

    // Employee stats - show rating if available
    const ratingDisplay = getRatingDisplay();
    if (ratingDisplay) {
      return (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Text style={[styles.statNumber, { color: ratingDisplay.color }]}>
                {ratingDisplay.text}
              </Text>
              <Ionicons name="star" size={16} color={ratingDisplay.color} />
            </View>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>
      );
    }

    return null; // Don't show stats card if no data
  };

  // Show loading if user info is being fetched
  if (userInfoLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show message if no API data available
  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color={COLORS.text.secondary} />
          <Text style={styles.loadingText}>Không thể tải thông tin từ server</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refetch}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={userInfoLoading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: userData.avatar }} 
                style={styles.avatar}
                defaultSource={require('../../../assets/icon.png')}
              />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleChangeAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Ionicons name="camera" size={16} color={COLORS.surface} />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
              <Text style={styles.userRole}>
                {role === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên'}
                {role === 'EMPLOYEE' && userData.hiredDate && 
                  ` • Làm việc từ ${userData.hiredDate}`
                }
                {role === 'CUSTOMER' && userData.joinedDate && 
                  ` • Tham gia ${userData.joinedDate}`
                }
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          
          <View style={styles.accountInfoCard}>
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountInfoLabel}>Họ tên:</Text>
              <Text style={styles.accountInfoValue}>{userData.name}</Text>
            </View>
            
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountInfoLabel}>Số điện thoại:</Text>
              <View style={styles.phoneVerificationContainer}>
                <Text style={styles.accountInfoValue}>{userData.phone}</Text>
                {userData.isPhoneVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                )}
              </View>
            </View>
            
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountInfoLabel}>Trạng thái:</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: userData.accountStatus === 'ACTIVE' ? COLORS.success : COLORS.error }
                ]}>
                  <Text style={styles.statusText}>
                    {userData.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                  </Text>
                </View>
              </View>
            </View>
            
            {userData.lastLogin && (
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Đăng nhập gần nhất:</Text>
                <Text style={styles.accountInfoValue}>{userData.lastLogin}</Text>
              </View>
            )}

            {userData.birthdate && (
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Ngày sinh:</Text>
                <Text style={styles.accountInfoValue}>{userData.birthdate}</Text>
              </View>
            )}

            <View style={styles.accountInfoRow}>
              <Text style={styles.accountInfoLabel}>Giới tính:</Text>
              <Text style={styles.accountInfoValue}>
                {userInfo?.isMale ? 'Nam' : 'Nữ'}
              </Text>
            </View>

            {userData.joinedDate && (
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Ngày tham gia:</Text>
                <Text style={styles.accountInfoValue}>{userData.joinedDate}</Text>
              </View>
            )}

            {userData.rating && (() => {
              const ratingDisplay = getRatingDisplay();
              if (!ratingDisplay) return null;
              
              return (
                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>
                    {role === 'CUSTOMER' ? 'Uy tín:' : 'Đánh giá:'}
                  </Text>
                  <View style={styles.phoneVerificationContainer}>
                    <Text style={[styles.accountInfoValue, { color: ratingDisplay.color }]}>
                      {ratingDisplay.text}
                    </Text>
                    <Ionicons name="star" size={16} color={ratingDisplay.color} />
                  </View>
                </View>
              );
            })()}

            {/* Employee specific info */}
            {role === 'EMPLOYEE' && (
              <>
                {userData.employeeStatus && (
                  <View style={styles.accountInfoRow}>
                    <Text style={styles.accountInfoLabel}>Trạng thái làm việc:</Text>
                    <View style={styles.statusContainer}>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: userData.employeeStatus === 'AVAILABLE' ? COLORS.success : COLORS.warning }
                      ]}>
                        <Text style={styles.statusText}>
                          {userData.employeeStatus === 'AVAILABLE' ? 'Sẵn sàng' : userData.employeeStatus}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {userData.hiredDate && (
                  <View style={styles.accountInfoRow}>
                    <Text style={styles.accountInfoLabel}>Ngày vào làm:</Text>
                    <Text style={styles.accountInfoValue}>{userData.hiredDate}</Text>
                  </View>
                )}

                {userData.skills && Array.isArray(userData.skills) && userData.skills.length > 0 && (
                  <View style={styles.skillsSection}>
                    <Text style={styles.accountInfoLabel}>Kỹ năng:</Text>
                    <View style={styles.skillsContainer}>
                      {userData.skills.map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {userData.bio && (
                  <View style={styles.bioSection}>
                    <Text style={styles.accountInfoLabel}>Giới thiệu:</Text>
                    <Text style={styles.bioText}>{userData.bio}</Text>
                  </View>
                )}
              </>
            )}

            {/* Customer specific info */}
            {role === 'CUSTOMER' && userData.vipLevel && (
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Hạng thành viên:</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.warning }]}>
                    <Text style={styles.statusText}>{userData.vipLevel}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Role Switcher - Show if user has multiple roles */}
            {userInfo?.roles && Array.isArray(userInfo.roles) && userInfo.roles.length > 1 && (
              <View style={styles.roleSwitchSection}>
                <Text style={styles.accountInfoLabel}>Chuyển đổi vai trò:</Text>
                <View style={styles.rolesContainer}>
                  {userInfo.roles.map((userRole) => (
                    <TouchableOpacity
                      key={userRole.roleId}
                      style={[
                        styles.roleButton,
                        role === userRole.roleName && styles.activeRoleButton
                      ]}
                      onPress={() => handleRoleSwitch(userRole.roleName as any)}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        role === userRole.roleName && styles.activeRoleButtonText
                      ]}>
                        {userRole.roleName === 'CUSTOMER' ? 'Khách hàng' : 
                         userRole.roleName === 'EMPLOYEE' ? 'Nhân viên' : userRole.roleName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt thông báo</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
              <Text style={styles.settingTitle}>Thông báo đẩy</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
              thumbColor={pushNotifications ? COLORS.primary : COLORS.text.tertiary}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
              <Text style={styles.settingTitle}>Thông báo email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
              thumbColor={emailNotifications ? COLORS.primary : COLORS.text.tertiary}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
            <Text style={styles.appBuild}>Build 2024.01.18</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom tab
  },
  headerGradient: {
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.8,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    marginTop: -10,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  membershipText: {
    color: COLORS.warning,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  menuItem: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    color: COLORS.text.primary,
    flex: 1,
  },
  appInfo: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appVersion: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  appBuild: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  logoutButton: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  accountInfoCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  accountInfoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  accountInfoValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  phoneVerificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  skillsSection: {
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
    paddingBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  skillText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bioSection: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginTop: 4,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  roleSwitchSection: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.surface,
  },
  activeRoleButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  roleButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  activeRoleButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});