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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserRole, RoleStatus, RootStackParamList } from '../../types/auth';
import { authService } from '../../services/authService';
import { useLanguage } from '../../hooks/useLanguage';
import { useStaticData } from '../../hooks/useStaticData';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components';

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

  const getRoleDisplayName = (role: UserRole) => {
    return data.roles?.[role] || role;
  };

  const getRoleDescription = (role: UserRole) => {
    return data.roleDescriptions?.[role] || '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
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
                  {selectedRole === role && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={[
                styles.roleDescription,
                selectedRole === role && styles.selectedRoleDescription
              ]}>
                {getRoleDescription(role)}
              </Text>
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
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    padding: 20,
  },
  selectedRoleCard: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  selectedRoleName: {
    color: '#007AFF',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  selectedRoleDescription: {
    color: '#0056CC',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RoleSelectionScreen;