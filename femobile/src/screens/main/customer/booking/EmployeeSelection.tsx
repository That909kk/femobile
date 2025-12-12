import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { bookingService, type Service, type Employee } from '../../../../services';
import { type LocationData, BookingStep, type PostBookingData, type BookingMode } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';
import { useUserInfo } from '../../../../hooks';

interface EmployeeSelectionProps {
  selectedService: Service | null;
  selectedLocation: LocationData | null;
  selectedDates: string[]; // Changed to support multiple dates
  selectedTime: string;
  bookingMode: BookingMode;
  selectedEmployeeId: string | null;
  isCreatingPost: boolean;
  postData: PostBookingData | null;
  onEmployeeSelect: (employeeId: string | null, employee: Employee | null) => void;
  onPostDataChange: (data: PostBookingData | null) => void;
  onCreatePostToggle: (isPost: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EmployeeSelection: React.FC<EmployeeSelectionProps> = ({
  selectedService,
  selectedLocation,
  selectedDates,
  selectedTime,
  bookingMode,
  selectedEmployeeId,
  isCreatingPost,
  postData,
  onEmployeeSelect,
  onPostDataChange,
  onCreatePostToggle,
  onNext,
  onBack,
}) => {
  const accentColor = colors.highlight.teal;
  const successColor = colors.feedback.success;
  const warningColor = colors.feedback.warning;
  const errorColor = colors.feedback.error;

  const { userInfo } = useUserInfo();
  const [loading, setLoading] = useState(false);
  const [suitableEmployees, setSuitableEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string>('');
  const [postTitle, setPostTitle] = useState(postData?.title || '');
  const [postImages, setPostImages] = useState<Array<{ uri: string; name: string; type: string }>>(postData?.images || []);

  // Load suitable employees when component mounts (not for recurring bookings)
  useEffect(() => {
    if (selectedService && selectedLocation && selectedDates.length > 0 && selectedTime && bookingMode !== 'recurring' && !isCreatingPost) {
      loadSuitableEmployees();
    }
  }, [selectedService, selectedLocation, selectedDates, selectedTime, bookingMode, isCreatingPost]);

  const loadSuitableEmployees = async () => {
    if (!selectedService || !selectedLocation || selectedDates.length === 0 || !selectedTime) {
      return;
    }

    // Validate required location data
    if (!selectedLocation.ward || !selectedLocation.city) {
      setError('Thiếu thông tin địa chỉ để tìm nhân viên phù hợp');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Format booking times for API
      const bookingTimes = selectedDates.map(date => `${date}T${selectedTime}:00`);
      
      const employees = await bookingService.findSuitableEmployees({
        serviceId: selectedService.serviceId,
        bookingTimes,
        ward: selectedLocation.ward,
        city: selectedLocation.city,
        customerId: userInfo?.id,
      });

      setSuitableEmployees(employees);
    } catch (err) {
      console.error('[EmployeeSelection] Error loading suitable employees:', err);
      setError('Có lỗi xảy ra khi tải danh sách nhân viên');
      setSuitableEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await pickImageFromCamera();
          } else if (buttonIndex === 2) {
            await pickImageFromLibrary();
          }
        }
      );
    } else {
      // Android: Show Alert
      Alert.alert(
        'Chọn ảnh',
        'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Chụp ảnh', onPress: pickImageFromCamera },
          { text: 'Chọn từ thư viện', onPress: pickImageFromLibrary },
        ]
      );
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập máy ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        
        const updatedImages = [...postImages, ...newImages].slice(0, 10);
        setPostImages(updatedImages);
        onPostDataChange({ title: postTitle, images: updatedImages });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - postImages.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        
        const updatedImages = [...postImages, ...newImages].slice(0, 10);
        setPostImages(updatedImages);
        onPostDataChange({ title: postTitle, images: updatedImages });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = postImages.filter((_, i) => i !== index);
    setPostImages(updatedImages);
    onPostDataChange({ title: postTitle, images: updatedImages });
  };

  const handleTitleChange = (text: string) => {
    setPostTitle(text);
    onPostDataChange({ title: text, images: postImages });
  };

  const handleTogglePostMode = () => {
    const newIsPost = !isCreatingPost;
    onCreatePostToggle(newIsPost);
    
    if (!newIsPost) {
      // Switching back to employee selection - clear post data
      setPostTitle('');
      setPostImages([]);
      onPostDataChange(null);
      onEmployeeSelect(null, null);
      // Reload employees
      if (selectedDates.length > 0 && bookingMode !== 'recurring') {
        loadSuitableEmployees();
      }
    } else {
      // Switching to post mode - clear employee selection
      onEmployeeSelect(null, null);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    // Allow deselecting by clicking the same employee
    if (selectedEmployeeId === employee.employeeId) {
      onEmployeeSelect(null, null);
    } else {
      onEmployeeSelect(employee.employeeId, employee);
    }
  };

  const renderEmployee = (employee: Employee) => (
    <TouchableOpacity
      key={employee.employeeId}
      style={[
        commonStyles.card,
        { marginBottom: 12, position: 'relative' },
        selectedEmployeeId === employee.employeeId && commonStyles.cardSelected
      ]}
      onPress={() => handleEmployeeSelect(employee)}
    >
      {/* Selected Badge */}
      {selectedEmployeeId === employee.employeeId && (
        <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <Ionicons name="checkmark-circle" size={28} color={accentColor} />
        </View>
      )}
      
      <View style={commonStyles.flexRow}>
        <Image
          source={{ uri: employee.avatar || 'https://picsum.photos/200' }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            marginRight: 12,
            backgroundColor: colors.warm.beige,
          }}
          defaultSource={{ uri: 'https://picsum.photos/200' }}
        />
        <View style={{ flex: 1, paddingRight: 36 }}>
          <Text style={commonStyles.cardTitle}>{employee.fullName}</Text>
          <View style={[commonStyles.flexRow, { marginTop: 4, flexWrap: 'wrap' }]}>
            <Ionicons name="star" size={16} color={colors.feedback.warning} />
            <Text style={[commonStyles.cardDescription, { marginLeft: 4 }]}>
              {employee.rating === 'HIGHEST' ? '5.0' : employee.rating}
            </Text>
            <Text style={[commonStyles.cardDescription, { marginLeft: 4 }]}>
              ({employee.completedJobs} công việc)
            </Text>
          </View>
          <Text
            style={[
              commonStyles.cardDescription,
              {
                marginTop: 4,
                color: employee.status === 'AVAILABLE' ? successColor : warningColor,
                fontWeight: '500',
              },
            ]}
          >
            {employee.status}
          </Text>
        </View>
      </View>
      
      {/* Skills */}
      {employee.skills && employee.skills.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[commonStyles.cardDescription, { marginBottom: 8, fontWeight: '500' }]}>Kỹ năng:</Text>
          <View style={commonStyles.flexRow}>
            {employee.skills.slice(0, 3).map((skill, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: 'rgba(27, 181, 166, 0.12)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginRight: 8,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: accentColor,
                    fontWeight: '500',
                  }}
                >
                  {skill}
                </Text>
              </View>
            ))}
            {employee.skills.length > 3 && (
              <Text style={[commonStyles.cardDescription, { alignSelf: 'center' }]}>
                +{employee.skills.length - 3} khác
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Working Area */}
      {employee.workingWards && employee.workingCity && (
        <View style={{ marginTop: 12 }}>
          <Text style={[commonStyles.cardDescription, { fontWeight: '500' }]}>Khu vực làm việc:</Text>
          <Text style={[commonStyles.cardDescription, { marginTop: 2 }]}>
            {employee.workingWards.join(', ')} - {employee.workingCity}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.warm.beige} />
      
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Chọn nhân viên</Text>
          <Text style={commonStyles.headerSubtitle}>Tìm nhân viên phù hợp</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.EMPLOYEE_SELECTION} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Summary */}
        {selectedService && (
          <View style={[commonStyles.card, { margin: 20, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Dịch vụ đã chọn</Text>
            <Text style={commonStyles.cardTitle}>{selectedService.name}</Text>
            {selectedService.basePrice && (
              <Text style={[commonStyles.cardPrice, { marginTop: 4 }]}>
                {selectedService.basePrice.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </View>
        )}

        {/* Time & Date Summary */}
        {selectedDates.length > 0 && selectedTime && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, marginBottom: 12 }]}>
            <View style={commonStyles.flexRowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>
                  {bookingMode === 'single' ? 'Ngày thực hiện' : `Số ngày: ${selectedDates.length}`}
                </Text>
                <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.highlight.teal} />
                  <Text style={[commonStyles.cardTitle, { marginLeft: 6, fontSize: 15 }]}>
                    {bookingMode === 'single' 
                      ? (() => {
                          const d = new Date(selectedDates[0]);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          return `${weekdays[d.getDay()]}, ${day}/${month}/${year}`;
                        })()
                      : (() => {
                          const d1 = new Date(selectedDates[0]);
                          const d2 = new Date(selectedDates[selectedDates.length - 1]);
                          const format = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                          return `${format(d1)} - ${format(d2)}`;
                        })()
                    }
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Giờ bắt đầu</Text>
                <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
                  <Ionicons name="time-outline" size={16} color={colors.highlight.teal} />
                  <Text style={[commonStyles.cardTitle, { marginLeft: 6, fontSize: 15 }]}>
                    {selectedTime}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Location Summary */}
        {selectedLocation && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Địa chỉ thực hiện</Text>
            <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
              <Ionicons name="location-outline" size={16} color={colors.highlight.teal} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={[commonStyles.cardTitle, { fontSize: 15 }]}>
                  {selectedLocation.fullAddress}
                </Text>
                {(selectedLocation.ward || selectedLocation.city) && (
                  <Text style={[commonStyles.cardDescription, { marginTop: 4 }]}>
                    {[selectedLocation.ward, selectedLocation.city]
                      .filter(item => item && item.trim())
                      .join(', ')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Toggle Mode */}
        {bookingMode !== 'recurring' && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.cardTitle}>Tạo bài đăng tìm nhân viên</Text>
              <Text style={commonStyles.cardDescription}>Hệ thống tự động tìm nhân viên phù hợp</Text>
            </View>
            <TouchableOpacity
              style={{
                width: 50,
                height: 30,
                borderRadius: 15,
                backgroundColor: isCreatingPost ? accentColor : colors.neutral.border,
                justifyContent: 'center',
                padding: 2,
              }}
              onPress={handleTogglePostMode}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.neutral.white,
                  transform: [{ translateX: isCreatingPost ? 20 : 0 }],
                }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Post Mode UI */}
        {isCreatingPost && bookingMode !== 'recurring' && (
          <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
            <Text style={commonStyles.sectionTitle}>Thông tin bài đăng</Text>
            
            {/* Title Input */}
            <View style={{ marginTop: 16 }}>
              <Text style={[commonStyles.cardDescription, { marginBottom: 8 }]}>Tiêu đề bài đăng</Text>
              <TextInput
                style={{
                  backgroundColor: colors.neutral.white,
                  borderWidth: 1,
                  borderColor: colors.neutral.border,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  color: colors.primary.navy,
                }}
                placeholder="Nhập tiêu đề (vd: Cần dọn dẹp nhà 3 tầng)"
                placeholderTextColor={colors.neutral.label}
                value={postTitle}
                onChangeText={handleTitleChange}
                maxLength={255}
              />
            </View>

            {/* Images */}
            <View style={{ marginTop: 16 }}>
              <Text style={[commonStyles.cardDescription, { marginBottom: 8 }]}>
                Hình ảnh ({postImages.length}/10)
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {postImages.map((image, index) => (
                  <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                    <Image source={{ uri: image.uri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: colors.feedback.error,
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close" size={16} color={colors.neutral.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {postImages.length < 10 && (
                  <TouchableOpacity
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.neutral.border,
                      borderStyle: 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.warm.beige,
                    }}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="camera-outline" size={32} color={accentColor} />
                    <Text style={[commonStyles.cardDescription, { marginTop: 4 }]}>Thêm ảnh</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Employee Selection UI */}
        {!isCreatingPost && bookingMode !== 'recurring' && (
          <View style={[commonStyles.section, { margin: 20, marginTop: 0, paddingTop: 0 }]}>
            <Text style={commonStyles.sectionTitle}>Nhân viên được đề xuất</Text>
            <Text style={commonStyles.sectionSubtitle}>
              Chọn nhân viên để đặt lịch trực tiếp
            </Text>

          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={commonStyles.loadingText}>Đang tìm nhân viên phù hợp...</Text>
            </View>
          ) : error ? (
            <View style={commonStyles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color={errorColor} />
              <Text style={commonStyles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadSuitableEmployees} style={[commonStyles.secondaryButton, { marginTop: 16 }]}>
                <Text style={commonStyles.secondaryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : suitableEmployees.length === 0 ? (
            <View style={[commonStyles.loadingContainer, { paddingVertical: 40 }]}>
              <Ionicons name="people-outline" size={48} color="#8E8E93" />
              <Text style={[commonStyles.loadingText, { marginTop: 16 }]}>Không tìm thấy nhân viên phù hợp</Text>
              <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8 }]}>
                Đừng lo lắng, bạn có thể tạo bài đăng và hệ thống sẽ tìm nhân viên phù hợp cho bạn
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              {suitableEmployees.map(renderEmployee)}
            </View>
          )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button Container */}
      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          onPress={onNext}
          style={[
            commonStyles.primaryButton,
            { justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }
          ]}
          disabled={loading}
        >
          <Text style={commonStyles.primaryButtonText}>
            {isCreatingPost 
              ? "Tiếp tục tạo bài đăng" 
              : selectedEmployeeId 
              ? "Tiếp tục với nhân viên đã chọn" 
              : bookingMode === 'recurring'
              ? "Tiếp tục"
              : "Bỏ qua (Hệ thống tự phân công)"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={colors.neutral.white}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

