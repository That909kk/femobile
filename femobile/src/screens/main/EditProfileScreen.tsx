import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth, useUserInfo } from '../../hooks';
import { Input, Button } from '../../components';
import { COLORS } from '../../constants';
import { userInfoService, UpdateCustomerRequest, UpdateEmployeeRequest } from '../../services';

interface EditProfileScreenProps {
  navigation: any;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { role } = useAuth();
  const { userInfo, refetch } = useUserInfo();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isMale, setIsMale] = useState(true);
  const [birthdate, setBirthdate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Employee specific fields
  const [hiredDate, setHiredDate] = useState<Date>(new Date());
  const [showHiredDatePicker, setShowHiredDatePicker] = useState(false);
  const [skills, setSkills] = useState<string>('');
  const [bio, setBio] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState('AVAILABLE');

  useEffect(() => {
    if (userInfo) {
      setFullName(userInfo.fullName || '');
      setEmail(userInfo.email || '');
      setIsMale(userInfo.isMale ?? true);
      
      if (userInfo.birthdate) {
        setBirthdate(new Date(userInfo.birthdate));
      }

      // Employee specific
      if (role === 'EMPLOYEE') {
        if (userInfo.hiredDate) {
          setHiredDate(new Date(userInfo.hiredDate));
        }
        setSkills(userInfo.skills?.join(', ') || '');
        setBio(userInfo.bio || '');
        setEmployeeStatus(userInfo.employeeStatus || 'AVAILABLE');
      }
    }
  }, [userInfo, role]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!fullName.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
        return;
      }

      if (!email.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập email');
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert('Lỗi', 'Email không hợp lệ');
        return;
      }

      setLoading(true);

      if (!userInfo?.id) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      if (role === 'CUSTOMER') {
        const data: UpdateCustomerRequest = {
          fullName: fullName.trim(),
          email: email.trim(),
          isMale,
          birthdate: birthdate.toISOString().split('T')[0], // YYYY-MM-DD format
        };

        await userInfoService.updateCustomer(userInfo.id, data);
      } else if (role === 'EMPLOYEE') {
        const skillsArray = skills
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        const data: UpdateEmployeeRequest = {
          fullName: fullName.trim(),
          email: email.trim(),
          isMale,
          birthdate: birthdate.toISOString().split('T')[0],
          hiredDate: hiredDate.toISOString().split('T')[0],
          skills: skillsArray,
          bio: bio.trim(),
          employeeStatus,
        };

        await userInfoService.updateEmployee(userInfo.id, data);
      } else {
        throw new Error('Vai trò không hợp lệ');
      }

      // Refresh user info
      await refetch();

      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthdate(selectedDate);
    }
  };

  const handleHiredDateChange = (event: any, selectedDate?: Date) => {
    setShowHiredDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setHiredDate(selectedDate);
    }
  };

  if (!userInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Full Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Họ và tên *</Text>
          <Input
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ và tên"
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.section}>
          <Text style={styles.label}>Email *</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, isMale && styles.genderButtonActive]}
              onPress={() => setIsMale(true)}
            >
              <Ionicons
                name="male"
                size={24}
                color={isMale ? COLORS.surface : COLORS.text.secondary}
              />
              <Text style={[styles.genderText, isMale && styles.genderTextActive]}>
                Nam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, !isMale && styles.genderButtonActive]}
              onPress={() => setIsMale(false)}
            >
              <Ionicons
                name="female"
                size={24}
                color={!isMale ? COLORS.surface : COLORS.text.secondary}
              />
              <Text style={[styles.genderText, !isMale && styles.genderTextActive]}>
                Nữ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Birthdate */}
        <View style={styles.section}>
          <Text style={styles.label}>Ngày sinh</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {birthdate.toLocaleDateString('vi-VN')}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthdate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Employee specific fields */}
        {role === 'EMPLOYEE' && (
          <>
            {/* Hired Date */}
            <View style={styles.section}>
              <Text style={styles.label}>Ngày vào làm</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowHiredDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {hiredDate.toLocaleDateString('vi-VN')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              {showHiredDatePicker && (
                <DateTimePicker
                  value={hiredDate}
                  mode="date"
                  display="default"
                  onChange={handleHiredDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Skills */}
            <View style={styles.section}>
              <Text style={styles.label}>Kỹ năng</Text>
              <Input
                value={skills}
                onChangeText={setSkills}
                placeholder="Nhập kỹ năng, cách nhau bởi dấu phẩy"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.hint}>
                Ví dụ: Dọn dẹp nhà cửa, Nấu ăn, Chăm sóc trẻ em
              </Text>
            </View>

            {/* Bio */}
            <View style={styles.section}>
              <Text style={styles.label}>Giới thiệu bản thân</Text>
              <Input
                value={bio}
                onChangeText={setBio}
                placeholder="Giới thiệu ngắn về bản thân"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Employee Status */}
            <View style={styles.section}>
              <Text style={styles.label}>Trạng thái làm việc</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    employeeStatus === 'AVAILABLE' && styles.statusButtonActive,
                  ]}
                  onPress={() => setEmployeeStatus('AVAILABLE')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      employeeStatus === 'AVAILABLE' && styles.statusTextActive,
                    ]}
                  >
                    Sẵn sàng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    employeeStatus === 'BUSY' && styles.statusButtonActive,
                  ]}
                  onPress={() => setEmployeeStatus('BUSY')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      employeeStatus === 'BUSY' && styles.statusTextActive,
                    ]}
                  >
                    Bận
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    employeeStatus === 'ON_LEAVE' && styles.statusButtonActive,
                  ]}
                  onPress={() => setEmployeeStatus('ON_LEAVE')}
                >
                  <Text
                    style={[
                      styles.statusText,
                      employeeStatus === 'ON_LEAVE' && styles.statusTextActive,
                    ]}
                  >
                    Nghỉ phép
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            onPress={handleSave}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  genderTextActive: {
    color: COLORS.surface,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  statusTextActive: {
    color: COLORS.surface,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});
