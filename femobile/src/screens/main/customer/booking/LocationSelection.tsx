import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { bookingService, addressService, type Province, type Commune } from '../../../../services';
import { useUserInfo } from '../../../../hooks';
import { STORAGE_KEYS } from '../../../../constants';
import { useAuthStore } from '../../../../store/authStore';
import { colors } from '../../../../styles';
import { type LocationData, BookingStep } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';
import { AddressPicker } from '../../../../components';

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type LocationOption = 'default' | 'gps' | 'manual';

interface LocationSelectionProps {
  selectedLocation?: LocationData | null;
  preloadedDefaultAddress?: LocationData | null;
  onNext: (location: LocationData) => void;
  onBack: () => void;
}

export const LocationSelection: React.FC<LocationSelectionProps> = ({
  selectedLocation,
  preloadedDefaultAddress,
  onNext,
  onBack
}) => {
  const { userInfo } = useUserInfo();
  const { isAuthenticated, accessToken, user: authUser } = useAuthStore();
  const accentColor = colors.highlight.teal;
  const warningColor = colors.feedback.warning;
  const errorColor = colors.feedback.error;
  const neutralLabelColor = colors.neutral.label;
  const [selectedOption, setSelectedOption] = useState<LocationOption>('default');
  const [defaultAddress, setDefaultAddress] = useState<LocationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [manualAddress, setManualAddress] = useState<LocationData>({
    fullAddress: '',
    ward: '',
    district: '', // Giữ lại để tương thích với API backend, nhưng sẽ để trống
    city: ''
  });
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 10.7769, // Default to Ho Chi Minh City
    longitude: 106.6601,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDefaultAddress, setLoadingDefaultAddress] = useState(false);
  const [hasTriedLoadingDefault, setHasTriedLoadingDefault] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [cachedLocation, setCachedLocation] = useState<LocationData | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState<LocationData | null>(null);
  const mapRef = useRef<MapView>(null);
  
  // Address picker states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');

  useEffect(() => {
    // Preload location permissions for faster GPS access
    preloadLocationPermissions();
    
    // Load provinces for manual address input
    loadProvinces();
  }, []);

  // Debug auth state changes
  useEffect(() => {
    // Auth state monitoring (silent in production)
  }, [isAuthenticated, accessToken, userInfo]);

  useEffect(() => {
    // Use preloaded default address if available
    if (preloadedDefaultAddress) {
      setDefaultAddress(preloadedDefaultAddress);
      setHasTriedLoadingDefault(true);
    } else if (isAuthenticated && accessToken && !hasTriedLoadingDefault) {
      loadDefaultAddress();
    }
  }, [isAuthenticated, accessToken, userInfo, preloadedDefaultAddress]);

  useEffect(() => {
    // Auto-select appropriate option based on available data
    if (defaultAddress && selectedOption !== 'default') {
      setSelectedOption('default');
    } else if (defaultAddress === null && selectedOption === 'default') {
      setSelectedOption('gps');
    }
  }, [defaultAddress]);

  const preloadLocationPermissions = async () => {
    try {
      await Location.getForegroundPermissionsAsync();
    } catch (error) {
      // Preload permissions failed silently
    }
  };

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const provincesList = await addressService.getProvinces();
      setProvinces(provincesList);
    } catch (error) {
      console.error('❌ Error loading provinces:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.');
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadCommunes = async (provinceCode: string) => {
    setLoadingCommunes(true);
    try {
      const communesList = await addressService.getCommunesByProvince(provinceCode);
      setCommunes(communesList);
    } catch (error) {
      console.error('❌ Error loading communes:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã. Vui lòng thử lại.');
      setCommunes([]);
    } finally {
      setLoadingCommunes(false);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.isDefault) {
        setSelectedOption('default');
      } else if (selectedLocation.latitude && selectedLocation.longitude) {
        setSelectedOption('gps');
        setCurrentLocation(selectedLocation);
        setMapRegion({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        setSelectedOption('manual');
        setManualAddress(selectedLocation);
      }
    }
  }, [selectedLocation]);

  const loadDefaultAddress = async () => {
    // Prevent multiple concurrent calls
    if (loadingDefaultAddress || hasTriedLoadingDefault) {
      return;
    }

    try {
      setLoadingDefaultAddress(true);
      setHasTriedLoadingDefault(true);
      
      // Check token availability
      let token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      
      // If no token, wait and retry (authentication might still be in progress)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
        
        token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        
        if (!token) {
          setDefaultAddress(null);
          return;
        }
      }
      
      // Try multiple sources for customerId
      const customerId = userInfo?.id || (authUser as any)?.customerId;
      
      if (!customerId) {
        setDefaultAddress(null);
        return;
      }
      
      const response = await bookingService.getDefaultAddress(customerId);

      if (!response) {
        setDefaultAddress(null);
        return;
      }

      // Response is now DefaultAddressResponse directly (not wrapped in ApiResponse)
      const addressData: LocationData = {
        addressId: response.addressId,
        fullAddress: response.fullAddress || '',
        ward: response.ward || '',
        district: '', // Will be extracted from city if needed
        city: response.city || '',
        latitude: response.latitude || 0,
        longitude: response.longitude || 0,
        isDefault: response.isDefault
      };

      // Extract district from city if needed for service calls
      // For TP. Hồ Chí Minh, we can use the city itself as district
      if (response.city === 'TP. Hồ Chí Minh') {
        addressData.district = 'TP. Hồ Chí Minh';
      }

      setDefaultAddress(addressData);
    } catch (error) {
      console.error('Error loading default address:', error);
      setDefaultAddress(null);
    } finally {
      setLoadingDefaultAddress(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để sử dụng GPS. Vui lòng cấp quyền trong cài đặt.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setGettingLocation(false);
        return;
      }
      
      // Try to get last known location first for faster loading
      let location;
      try {
        const lastKnownLocation = await Location.getLastKnownPositionAsync({
          maxAge: 60000, // 1 minute cache
          requiredAccuracy: 1000, // 1km accuracy for initial load
        });
        
        if (lastKnownLocation) {
          location = lastKnownLocation;
        }
      } catch (error) {
        // No cached location available
      }

      // If no cached location, get fresh position with optimized settings
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Faster than High
        });
      }

      const { latitude, longitude } = location.coords;

      // Set map region
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Do reverse geocoding for address
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const locationData: LocationData = {
          fullAddress: [
            address.name,
            address.street,
            address.district,
            address.city || address.region
          ].filter(Boolean).join(', '),
          ward: address.district || '',
          district: '', // Không dùng nữa - để trống
          city: address.city || address.region || '',
          latitude,
          longitude,
          isDefault: false
        };

        setCurrentLocation(locationData);
        setCachedLocation(locationData);
      } catch (geocodeError) {
        const coordinateLocationData: LocationData = {
          fullAddress: `Tọa độ: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          ward: '',
          district: '',
          city: '',
          latitude,
          longitude,
          isDefault: false
        };
        
        setCurrentLocation(coordinateLocationData);
        setCachedLocation(coordinateLocationData);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    setLoading(true);
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const locationData: LocationData = {
        fullAddress: [
          address.name,
          address.street,
          address.district,
          address.city || address.region
        ].filter(Boolean).join(', '),
        ward: address.district || '',
        district: '', // Không dùng nữa - để trống
        city: address.city || address.region || '',
        latitude,
        longitude,
        isDefault: false
      };

      setTempMapLocation(locationData);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      const coordinateLocationData: LocationData = {
        fullAddress: `Tọa độ: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        ward: '',
        district: '',
        city: '',
        latitude,
        longitude,
        isDefault: false
      };
      setTempMapLocation(coordinateLocationData);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMapLocation = () => {
    if (tempMapLocation) {
      setCurrentLocation(tempMapLocation);
      setCachedLocation(tempMapLocation);
      setIsMapModalVisible(false);
      setTempMapLocation(null);
    }
  };

  const handleOpenMap = () => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      setTempMapLocation(currentLocation);
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    setIsMapModalVisible(true);
  };

  const handleOptionSelect = (option: LocationOption) => {
    // Don't allow selecting default if no default address available
    if (option === 'default' && !defaultAddress) {
      Alert.alert(
        'Không có địa chỉ mặc định', 
        'Bạn chưa có địa chỉ mặc định. Vui lòng sử dụng GPS hoặc nhập địa chỉ mới.'
      );
      return;
    }
    
    setSelectedOption(option);
    
    if (option === 'gps') {
      // Use cached location if available and recent (less than 5 minutes old)
      if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
        setCurrentLocation(cachedLocation);
        // Still get fresh location in background
        getCurrentLocation();
      } else if (!currentLocation) {
        getCurrentLocation();
      }
    }
  };

  const getSelectedLocationData = (): LocationData | null => {
    switch (selectedOption) {
      case 'default':
        return defaultAddress;
      case 'gps':
        return currentLocation;
      case 'manual':
        return manualAddress.fullAddress?.trim() ? manualAddress : null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const locationData = getSelectedLocationData();
    
    if (!locationData) {
      Alert.alert('Thông báo', 'Vui lòng chọn địa điểm hoặc nhập địa chỉ');
      return;
    }

    if (selectedOption === 'manual') {
      if (!locationData.fullAddress?.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường)');
        return;
      }
      if (!locationData.city?.trim()) {
        Alert.alert('Thông báo', 'Vui lòng chọn tỉnh/thành phố');
        return;
      }
      if (!locationData.ward?.trim()) {
        Alert.alert('Thông báo', 'Vui lòng chọn phường/xã');
        return;
      }
    }

    onNext(locationData);
  };

  const renderOptionCard = (
    option: LocationOption,
    title: string,
    subtitle: string,
    icon: string,
    isSelected: boolean,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        commonStyles.card,
        isSelected && commonStyles.cardSelected,
        disabled && { opacity: 0.5 },
        { marginHorizontal: 20 }
      ]}
      onPress={() => !disabled && handleOptionSelect(option)}
      disabled={disabled}
    >
      <View style={commonStyles.flexRow}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: disabled
              ? colors.neutral.border
              : isSelected
              ? accentColor
              : colors.warm.beige,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Ionicons
            name={icon as any}
            size={24}
            color={disabled ? neutralLabelColor : isSelected ? colors.neutral.white : accentColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[
            commonStyles.cardTitle,
            disabled && { color: neutralLabelColor }
          ]}>
            {title}
          </Text>
          <Text style={[
            commonStyles.cardDescription,
            disabled && { color: neutralLabelColor }
          ]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={accentColor} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMapView = () => (
    <View style={[commonStyles.section, { margin: 20 }]}>
      <Text style={commonStyles.sectionTitle}>Sử dụng vị trí hiện tại</Text>
      <Text style={commonStyles.sectionSubtitle}>Lấy tọa độ GPS của thiết bị</Text>
      
      {gettingLocation && (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={commonStyles.loadingText}>Đang lấy vị trí hiện tại...</Text>
        </View>
      )}

      {currentLocation && (
        <View style={[commonStyles.card, { marginVertical: 16 }]}>
          <Text style={commonStyles.cardTitle}>Địa chỉ được chọn:</Text>
          <Text style={[commonStyles.cardDescription, { color: accentColor, fontWeight: '600', marginTop: 4 }]}>
            {currentLocation.fullAddress}
          </Text>
          {currentLocation.latitude && currentLocation.longitude && (
            <Text style={[commonStyles.cardDescription, { fontSize: 12, marginTop: 4, color: neutralLabelColor }]}>
              Tọa độ: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      )}

      {!currentLocation && !gettingLocation && (
        <TouchableOpacity
          style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
          onPress={getCurrentLocation}
        >
          <Ionicons name="location" size={24} color={accentColor} />
          <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Lấy vị trí hiện tại</Text>
        </TouchableOpacity>
      )}

      {currentLocation && (
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
            onPress={handleOpenMap}
          >
            <Ionicons name="map" size={20} color={accentColor} />
            <Text style={[commonStyles.secondaryButtonText, { marginLeft: 6 }]}>Chỉnh sửa trên bản đồ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
            onPress={getCurrentLocation}
          >
            <Ionicons name="refresh" size={20} color={accentColor} />
            <Text style={[commonStyles.secondaryButtonText, { marginLeft: 6 }]}>Cập nhật vị trí</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderManualInput = () => {
    const provinceOptions = provinces.map(p => ({
      label: p.name,
      value: p.code,
      code: p.code
    }));

    const communeOptions = communes.map(c => ({
      label: c.name,
      value: c.code,
      code: c.code
    }));

    return (
      <View style={[commonStyles.section, { margin: 20 }]}>
        <Text style={commonStyles.sectionTitle}>Nhập địa chỉ mới</Text>
        <Text style={commonStyles.sectionSubtitle}>
          Địa chỉ được chia thành 2 cấp: Tỉnh/Thành phố và Phường/Xã
        </Text>
        
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Địa chỉ cụ thể *</Text>
          <TextInput
            style={[commonStyles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]}
            value={manualAddress.fullAddress}
            onChangeText={(text) => setManualAddress({ ...manualAddress, fullAddress: text })}
            placeholder="Ví dụ: 123 Nguyễn Văn Linh hoặc Số 45 Đường Lê Lợi"
            multiline
            numberOfLines={4}
          />
       
        </View>

        <AddressPicker
          label="Tỉnh/Thành phố *"
          placeholder="Chọn tỉnh/thành phố"
          value={manualAddress.city || ''}
          options={provinceOptions}
          onSelect={(option) => {
            setManualAddress({ 
              ...manualAddress, 
              city: option.label,
              ward: '', // Reset ward when province changes
              district: '' // Để trống vì không còn dùng
            });
            setSelectedProvinceCode(option.code || '');
            if (option.code) {
              loadCommunes(option.code);
            }
          }}
          loading={loadingProvinces}
        />

        <AddressPicker
          label="Phường/Xã *"
          placeholder="Chọn phường/xã"
          value={manualAddress.ward || ''}
          options={communeOptions}
          onSelect={(option) => {
            setManualAddress({ 
              ...manualAddress, 
              ward: option.label,
              district: '' // Để trống vì không còn dùng
            });
          }}
          loading={loadingCommunes}
          disabled={!selectedProvinceCode}
        />

        {!selectedProvinceCode && (
          <Text style={styles.helperText}>
            * Vui lòng chọn tỉnh/thành phố trước
          </Text>
        )}
        
        {manualAddress.city && manualAddress.ward && (
          <View style={[commonStyles.card, { marginTop: 16, backgroundColor: colors.warm.beige }]}>
            <Text style={[commonStyles.cardTitle, { fontSize: 13, marginBottom: 4 }]}>
              Địa chỉ đầy đủ:
            </Text>
            <Text style={[commonStyles.cardDescription, { color: colors.primary.navy, fontWeight: '600' }]}>
              {manualAddress.fullAddress}
              {manualAddress.fullAddress && ', '}
              {manualAddress.ward}, {manualAddress.city}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={commonStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.warm.beige} />
        
        {/* Header */}
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
          </TouchableOpacity>
          <View style={commonStyles.headerContent}>
            <Text style={commonStyles.headerTitle}>Chọn địa điểm</Text>
            <Text style={commonStyles.headerSubtitle}>Xác định vị trí dịch vụ</Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={BookingStep.LOCATION_SELECTION} />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Option Cards */}
            <View style={{ paddingTop: 16 }}>
              {renderOptionCard(
                'default',
                'Địa chỉ mặc định',
                loadingDefaultAddress 
                  ? 'Đang tải địa chỉ...' 
                  : (defaultAddress ? (defaultAddress.fullAddress || 'Địa chỉ mặc định') : 'Chưa có địa chỉ mặc định - Vui lòng thêm địa chỉ'),
                'home',
                selectedOption === 'default' && !!defaultAddress,
                loadingDefaultAddress || !defaultAddress // disabled if loading or no default address
              )}

              {renderOptionCard(
                'gps',
                'Vị trí hiện tại',
                'Sử dụng GPS và bản đồ',
                'location',
                selectedOption === 'gps'
              )}

              {renderOptionCard(
                'manual',
                'Nhập địa chỉ mới',
                'Nhập thủ công thông tin địa chỉ',
                'create',
                selectedOption === 'manual'
              )}
            </View>

            {/* Conditional Content */}
            {selectedOption === 'gps' && renderMapView()}
            {selectedOption === 'manual' && renderManualInput()}

            {/* Default Address Details */}
            {selectedOption === 'default' && (
              <View style={[commonStyles.section, { margin: 20 }]}>
                {defaultAddress ? (
                  <>
                    <Text style={commonStyles.sectionTitle}>Thông tin địa chỉ:</Text>
                    <Text style={[commonStyles.cardTitle, { fontWeight: '600' }]}>{defaultAddress.fullAddress}</Text>
                    <Text style={commonStyles.cardDescription}>
                      {defaultAddress.ward}, {defaultAddress.city}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={commonStyles.sectionTitle}>
                      {loadingDefaultAddress ? 'Đang tải địa chỉ mặc định...' : 'Không tìm thấy địa chỉ mặc định'}
                    </Text>
                    {!loadingDefaultAddress && (
                      <TouchableOpacity 
                        style={[commonStyles.secondaryButton, { alignSelf: 'flex-start', marginTop: 8 }]}
                        onPress={() => {
                          setHasTriedLoadingDefault(false);
                          loadDefaultAddress();
                        }}
                      >
                        <Text style={commonStyles.secondaryButtonText}>Thử lại</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Bottom Button */}
        <View style={commonStyles.buttonContainer}>
          <TouchableOpacity
            style={[
              commonStyles.primaryButton,
              commonStyles.flexRow,
              { justifyContent: 'center' },
              loading && commonStyles.primaryButtonDisabled
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <Text style={commonStyles.primaryButtonText}>Đang tải...</Text>
            ) : (
              <>
                <Text style={commonStyles.primaryButtonText}>Tiếp tục</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Map Modal */}
        <Modal
          visible={isMapModalVisible}
          animationType="slide"
          onRequestClose={() => setIsMapModalVisible(false)}
        >
          <View style={styles.mapModalContainer}>
            <View style={styles.mapModalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setIsMapModalVisible(false);
                  setTempMapLocation(null);
                }}
                style={styles.mapModalCloseButton}
              >
                <Ionicons name="close" size={28} color={colors.primary.navy} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.mapModalTitle}>Chọn vị trí trên bản đồ</Text>
                <Text style={styles.mapModalSubtitle}>Chạm vào bản đồ để chọn địa điểm</Text>
              </View>
              <View style={{ width: 28 }} />
            </View>

            {tempMapLocation && (
              <View style={styles.mapAddressCard}>
                <Ionicons name="location" size={20} color={accentColor} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapAddressText} numberOfLines={2}>
                    {tempMapLocation.fullAddress}
                  </Text>
                  {tempMapLocation.latitude && tempMapLocation.longitude && (
                    <Text style={styles.mapCoordinatesText}>
                      {tempMapLocation.latitude.toFixed(6)}, {tempMapLocation.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={mapRegion}
              region={mapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              loadingEnabled={true}
            >
              {tempMapLocation?.latitude && tempMapLocation?.longitude && (
                <Marker
                  coordinate={{
                    latitude: tempMapLocation.latitude,
                    longitude: tempMapLocation.longitude,
                  }}
                  title="Vị trí đã chọn"
                  description={tempMapLocation.fullAddress}
                  pinColor={accentColor}
                />
              )}
            </MapView>

            {loading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={accentColor} />
                <Text style={styles.mapLoadingText}>Đang tải địa chỉ...</Text>
              </View>
            )}

            <View style={styles.mapModalFooter}>
              <TouchableOpacity
                style={[
                  commonStyles.primaryButton,
                  !tempMapLocation && { opacity: 0.5 }
                ]}
                onPress={handleConfirmMapLocation}
                disabled={!tempMapLocation}
              >
                <Text style={commonStyles.primaryButtonText}>Xác nhận vị trí này</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mapModalContainer: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44,
    paddingBottom: 12,
    backgroundColor: colors.warm.beige,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapModalCloseButton: {
    padding: 4,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  mapModalSubtitle: {
    fontSize: 13,
    color: colors.neutral.label,
    marginTop: 2,
  },
  mapAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.navy,
    lineHeight: 20,
  },
  mapCoordinatesText: {
    fontSize: 11,
    color: colors.neutral.label,
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.primary.navy,
    fontWeight: '500',
  },
  mapModalFooter: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helperText: {
    fontSize: 13,
    color: colors.neutral.label,
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 12,
  },
});