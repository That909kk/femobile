import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { COLORS } from '../../constants';
import { authService } from '../../services';
import { useAuth } from '../../hooks';

interface ChangePasswordScreenProps {
  navigation: any;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): string | null => {
    // TC_CHANGE_PASSWORD_009: Empty current password
    if (!currentPassword.trim()) {
      return 'Vui lòng nhập mật khẩu hiện tại';
    }

    // TC_CHANGE_PASSWORD_006: New password too short
    if (newPassword.length < 6) {
      return 'Mật khẩu mới phải có từ 6 đến 50 ký tự';
    }

    // TC_CHANGE_PASSWORD_007: New password too long
    if (newPassword.length > 50) {
      return 'Mật khẩu mới phải có từ 6 đến 50 ký tự';
    }

    // TC_CHANGE_PASSWORD_008: Same current and new password
    if (currentPassword === newPassword) {
      return 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    // TC_CHANGE_PASSWORD_005: Password confirmation mismatch
    if (newPassword !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }

    return null;
  };

  const handleChangePassword = async () => {
    try {
      // Validate form
      const validationError = validateForm();
      if (validationError) {
        Alert.alert('Lỗi', validationError);
        return;
      }

      setLoading(true);

      // Call API
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Show success message
      Alert.alert(
        'Thành công',
        'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // TC_CHANGE_PASSWORD_001: All user sessions are terminated
              await logout();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle specific error messages from API
      let errorMessage = 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      
      if (error.message) {
        // TC_CHANGE_PASSWORD_004: Incorrect current password
        if (error.message.includes('không đúng') || error.message.includes('hiện tại')) {
          errorMessage = 'Mật khẩu hiện tại không đúng';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Sau khi đổi mật khẩu thành công, bạn sẽ cần đăng nhập lại.
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.section}>
          <Text style={styles.label}>Mật khẩu hiện tại *</Text>
          <Input
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry={true}
            autoCapitalize="none"
          />
        </View>

        {/* New Password */}
        <View style={styles.section}>
          <Text style={styles.label}>Mật khẩu mới *</Text>
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nhập mật khẩu mới (6-50 ký tự)"
            secureTextEntry={true}
            autoCapitalize="none"
          />
          <Text style={styles.hint}>
            Mật khẩu phải có từ 6 đến 50 ký tự và khác mật khẩu hiện tại
          </Text>
        </View>

        {/* Confirm Password */}
        <View style={styles.section}>
          <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry={true}
            autoCapitalize="none"
          />
        </View>

        {/* Change Password Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            onPress={handleChangePassword}
            disabled={loading}
            loading={loading}
          />
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});
