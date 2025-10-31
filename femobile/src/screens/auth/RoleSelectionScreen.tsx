import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserRole, RoleStatus, RootStackParamList } from '../../types/auth';
import { authService } from '../../services/authService';
import { useLanguage } from '../../hooks/useLanguage';
import { useStaticData } from '../../hooks/useStaticData';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components';
import { colors, typography, spacing, borderRadius, shadows, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

const RoleSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { username, password, availableRoles } = route.params;
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { language: currentLanguage } = useLanguage();
  const { data: staticData } = useStaticData('role-selection');
  const { login } = useAuth();

  const data = staticData?.['role-selection']?.[currentLanguage] || {};

  const activeRoles = Object.entries(availableRoles)
    .filter(([_, status]) => status === 'ACTIVE')
    .filter(([role, _]) => role !== 'ADMIN') // Exclude ADMIN role for mobile app
    .map(([role, _]) => role as UserRole);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Thông báo', data.messages?.selectRole || 'Vui lòng chọn một vai trò');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use login hook to handle token storage and user state
      await login({
        username,
        password,
        role: selectedRole,
        deviceType: 'MOBILE'
      });
      
      // Login successful - authentication state will update automatically
      // and navigation will switch to MainStack
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || data.messages?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getRoleIcon = (role: UserRole): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'CUSTOMER':
        return 'person-outline';
      case 'EMPLOYEE':
        return 'briefcase-outline';
      case 'ADMIN':
        return 'shield-checkmark-outline';
      default:
        return 'person-outline';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    return data.roles?.[role] || role;
  };

  const getRoleDescription = (role: UserRole) => {
    return data.roleDescriptions?.[role] || '';
  };

  return (
    <LinearGradient
      colors={['#E8F5F3', '#F0F9FF', '#FFFFFF']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="people" size={responsive.moderateScale(40)} color={colors.highlight.teal} />
            </View>
            <Text style={styles.title}>{data.title || 'Chọn vai trò'}</Text>
            <Text style={styles.subtitle}>
              {data.subtitle || 'Tài khoản của bạn có nhiều vai trò. Vui lòng chọn vai trò để đăng nhập.'}
            </Text>
          </View>

          <View style={styles.rolesContainer}>
            {activeRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleCard,
                  selectedRole === role && styles.selectedRoleCard
                ]}
                onPress={() => handleRoleSelect(role)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={selectedRole === role 
                    ? ['#1BB5A6', '#17A699'] 
                    : ['#FFFFFF', '#F8FAFB']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.roleGradient}
                >
                  <View style={styles.roleContent}>
                    <View style={[
                      styles.roleIconContainer,
                      selectedRole === role && styles.selectedRoleIconContainer
                    ]}>
                      <Ionicons 
                        name={getRoleIcon(role)} 
                        size={responsive.moderateScale(32)} 
                        color={selectedRole === role ? colors.neutral.white : colors.highlight.teal}
                      />
                    </View>
                    
                    <View style={styles.roleInfo}>
                      <View style={styles.roleHeader}>
                        <Text style={[
                          styles.roleName,
                          selectedRole === role && styles.selectedRoleName
                        ]}>
                          {getRoleDisplayName(role)}
                        </Text>
                        <View style={[
                          styles.radioButton,
                          selectedRole === role && styles.selectedRadioButton
                        ]}>
                          {selectedRole === role && (
                            <Ionicons 
                              name="checkmark" 
                              size={responsive.moderateScale(16)} 
                              color={colors.neutral.white}
                            />
                          )}
                        </View>
                      </View>
                      <Text style={[
                        styles.roleDescription,
                        selectedRole === role && styles.selectedRoleDescription
                      ]}>
                        {getRoleDescription(role)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <View style={styles.backButton}>
              <Button
                title={data.actions?.back || 'Quay lại'}
                onPress={handleBack}
                variant="outline"
                fullWidth
                disabled={isLoading}
              />
            </View>
            <View style={styles.continueButton}>
              <Button
                title={isLoading ? (data.messages?.loading || 'Đang xử lý...') : (data.actions?.continue || 'Tiếp tục')}
                onPress={handleContinue}
                fullWidth
                disabled={!selectedRole || isLoading}
              />
            </View>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.highlight.teal} />
              <Text style={styles.loadingText}>{data.messages?.loading || 'Đang xử lý...'}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.xl,
  },
  header: {
    paddingTop: responsiveSpacing.xl,
    paddingBottom: responsiveSpacing.xl,
    alignItems: 'center',
  },
  logoCircle: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
    ...shadows.card,
  },
  title: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.primary.navy,
    textAlign: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  subtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: responsive.moderateScale(24),
    paddingHorizontal: responsiveSpacing.lg,
  },
  rolesContainer: {
    gap: responsiveSpacing.lg,
  },
  roleCard: {
    borderRadius: responsive.moderateScale(16),
    overflow: 'hidden',
    ...shadows.card,
  },
  selectedRoleCard: {
    ...shadows.button,
  },
  roleGradient: {
    borderRadius: responsive.moderateScale(16),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleContent: {
    flexDirection: 'row',
    padding: responsiveSpacing.lg,
    alignItems: 'center',
  },
  roleIconContainer: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.md,
  },
  selectedRoleIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleInfo: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.xs,
  },
  roleName: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
    flex: 1,
  },
  selectedRoleName: {
    color: colors.neutral.white,
  },
  roleDescription: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    lineHeight: responsive.moderateScale(20),
    paddingRight: responsiveSpacing.sm,
  },
  selectedRoleDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  radioButton: {
    width: responsive.moderateScale(24),
    height: responsive.moderateScale(24),
    borderRadius: responsive.moderateScale(12),
    borderWidth: 2,
    borderColor: colors.neutral.label,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing.sm,
  },
  selectedRadioButton: {
    borderColor: colors.neutral.white,
    backgroundColor: colors.neutral.white,
  },
  radioButtonInner: {
    width: responsive.moderateScale(12),
    height: responsive.moderateScale(12),
    borderRadius: responsive.moderateScale(6),
    backgroundColor: colors.highlight.teal,
  },
  footer: {
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.md,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: responsiveSpacing.sm,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  loadingText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    fontWeight: '500',
  },
});

export default RoleSelectionScreen;