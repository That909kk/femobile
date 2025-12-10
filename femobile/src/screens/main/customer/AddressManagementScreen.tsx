import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';
import { customerService, addressService } from '../../../services';
import { useUserInfo } from '../../../hooks';
import type { CustomerAddress } from '../../../services/customerService';
import type { Province, Commune } from '../../../services/addressService';

interface AddressFormData {
  fullAddress: string;
  ward: string;
  city: string;
  isDefault: boolean;
}

export const AddressManagementScreen = () => {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<AddressFormData>({
    fullAddress: '',
    ward: '',
    city: '',
    isDefault: false,
  });
  
  // Address picker states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showCommunePicker, setShowCommunePicker] = useState(false);
  const [searchProvince, setSearchProvince] = useState('');
  const [searchCommune, setSearchCommune] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const customerId = userInfo?.id;

  useEffect(() => {
    if (customerId) {
      loadAddresses();
      loadProvinces();
    }
  }, [customerId]);

  const loadAddresses = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const data = await customerService.getCustomerAddresses(customerId);
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const data = await addressService.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadCommunes = async (provinceCode: string) => {
    try {
      setLoadingCommunes(true);
      const data = await addressService.getCommunesByProvince(provinceCode);
      setCommunes(data);
    } catch (error) {
      console.error('Error loading communes:', error);
    } finally {
      setLoadingCommunes(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  }, [customerId]);

  const resetForm = () => {
    setFormData({
      fullAddress: '',
      ward: '',
      city: '',
      isDefault: false,
    });
    setSelectedProvince(null);
    setSelectedCommune(null);
    setCommunes([]);
  };

  const handleAddAddress = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setSelectedAddress(address);
    setFormData({
      fullAddress: address.fullAddress,
      ward: address.ward,
      city: address.city,
      isDefault: address.isDefault,
    });
    setShowEditModal(true);
  };

  const handleDeleteAddress = (address: CustomerAddress) => {
    if (address.isDefault) {
      Alert.alert('Không thể xóa', 'Bạn không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước.');
      return;
    }

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerService.deleteAddress(customerId!, address.addressId);
              Alert.alert('Thành công', 'Đã xóa địa chỉ');
              loadAddresses();
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Lỗi', 'Không thể xóa địa chỉ');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (address: CustomerAddress) => {
    if (address.isDefault) return;

    try {
      await customerService.setDefaultAddress(customerId!, address.addressId);
      Alert.alert('Thành công', 'Đã đặt làm địa chỉ mặc định');
      loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Lỗi', 'Không thể đặt địa chỉ mặc định');
    }
  };

  const handleSelectProvince = (province: Province) => {
    setSelectedProvince(province);
    setFormData(prev => ({ ...prev, city: province.name }));
    setShowProvincePicker(false);
    setSearchProvince('');
    setSelectedCommune(null);
    setCommunes([]);
    loadCommunes(province.code);
  };

  const handleSelectCommune = (commune: Commune) => {
    setSelectedCommune(commune);
    setFormData(prev => ({ ...prev, ward: commune.name }));
    setShowCommunePicker(false);
    setSearchCommune('');
  };

  const validateForm = (): boolean => {
    if (!formData.fullAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return false;
    }
    if (!formData.ward.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn phường/xã');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn tỉnh/thành phố');
      return false;
    }
    return true;
  };

  const handleSaveNewAddress = async () => {
    if (!validateForm() || !customerId) return;

    try {
      setSaving(true);
      await customerService.createAddress({
        customerId,
        fullAddress: formData.fullAddress.trim(),
        ward: formData.ward,
        city: formData.city,
        isDefault: formData.isDefault,
      });
      Alert.alert('Thành công', 'Đã thêm địa chỉ mới');
      setShowAddModal(false);
      resetForm();
      loadAddresses();
    } catch (error) {
      console.error('Error creating address:', error);
      Alert.alert('Lỗi', 'Không thể thêm địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!validateForm() || !customerId || !selectedAddress) return;

    try {
      setSaving(true);
      await customerService.updateAddress(customerId, selectedAddress.addressId, {
        fullAddress: formData.fullAddress.trim(),
        ward: formData.ward,
        city: formData.city,
        isDefault: formData.isDefault,
      });
      Alert.alert('Thành công', 'Đã cập nhật địa chỉ');
      setShowEditModal(false);
      setSelectedAddress(null);
      resetForm();
      loadAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const filteredProvinces = searchProvince
    ? addressService.searchProvinces(provinces, searchProvince)
    : provinces;

  const filteredCommunes = searchCommune
    ? addressService.searchCommunes(communes, searchCommune)
    : communes;

  const renderAddressCard = (address: CustomerAddress) => (
    <View key={address.addressId} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressIconContainer}>
          <Ionicons 
            name={address.isDefault ? 'location' : 'location-outline'} 
            size={24} 
            color={address.isDefault ? colors.highlight.teal : colors.neutral.textSecondary} 
          />
        </View>
        <View style={styles.addressInfo}>
          <View style={styles.addressTitleRow}>
            <Text style={styles.addressTitle} numberOfLines={2}>
              {address.fullAddress}
            </Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Mặc định</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressSubtitle}>
            {address.ward}, {address.city}
          </Text>
        </View>
      </View>
      
      <View style={styles.addressActions}>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(address)}
          >
            <Ionicons name="star-outline" size={18} color={colors.highlight.teal} />
            <Text style={[styles.actionText, { color: colors.highlight.teal }]}>
              Đặt mặc định
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(address)}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary.navy} />
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(address)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.feedback.error} />
            <Text style={[styles.actionText, { color: colors.feedback.error }]}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderAddressForm = () => (
    <View style={styles.formContainer}>
      {/* Province Picker */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Tỉnh/Thành phố *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowProvincePicker(true)}
        >
          <Text style={[
            styles.pickerButtonText,
            !formData.city && styles.pickerPlaceholder
          ]}>
            {formData.city || 'Chọn tỉnh/thành phố'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.neutral.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Commune Picker */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Phường/Xã *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, !selectedProvince && styles.pickerDisabled]}
          onPress={() => selectedProvince && setShowCommunePicker(true)}
          disabled={!selectedProvince}
        >
          <Text style={[
            styles.pickerButtonText,
            !formData.ward && styles.pickerPlaceholder
          ]}>
            {formData.ward || 'Chọn phường/xã'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.neutral.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Full Address */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Địa chỉ chi tiết *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Số nhà, tên đường..."
          value={formData.fullAddress}
          onChangeText={(text) => setFormData(prev => ({ ...prev, fullAddress: text }))}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Default checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
      >
        <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
          {formData.isDefault && (
            <Ionicons name="checkmark" size={16} color={colors.neutral.white} />
          )}
        </View>
        <Text style={styles.checkboxLabel}>Đặt làm địa chỉ mặc định</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: any[],
    searchValue: string,
    onSearchChange: (text: string) => void,
    onSelect: (item: any) => void,
    loading: boolean,
    labelKey: string = 'name'
  ) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.primary.navy} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.neutral.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              value={searchValue}
              onChangeText={onSearchChange}
            />
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.highlight.teal} style={styles.loader} />
          ) : (
            <ScrollView style={styles.pickerList}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.code || index}
                  style={styles.pickerItem}
                  onPress={() => onSelect(item)}
                >
                  <Text style={styles.pickerItemText}>{item[labelKey]}</Text>
                </TouchableOpacity>
              ))}
              {items.length === 0 && (
                <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.highlight.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>
        <TouchableOpacity onPress={handleAddAddress} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.highlight.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.neutral.border} />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptySubtitle}>
              Thêm địa chỉ để đặt dịch vụ nhanh hơn
            </Text>
            <TouchableOpacity style={styles.addFirstButton} onPress={handleAddAddress}>
              <Ionicons name="add" size={20} color={colors.neutral.white} />
              <Text style={styles.addFirstButtonText}>Thêm địa chỉ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map(renderAddressCard)}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm địa chỉ mới</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.primary.navy} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {renderAddressForm()}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setShowAddModal(false); resetForm(); }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSaveNewAddress}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.neutral.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa địa chỉ</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setSelectedAddress(null); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.primary.navy} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {renderAddressForm()}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setShowEditModal(false); setSelectedAddress(null); resetForm(); }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleUpdateAddress}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.neutral.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Province Picker Modal */}
      {renderPickerModal(
        showProvincePicker,
        () => { setShowProvincePicker(false); setSearchProvince(''); },
        'Chọn Tỉnh/Thành phố',
        filteredProvinces,
        searchProvince,
        setSearchProvince,
        handleSelectProvince,
        loadingProvinces
      )}

      {/* Commune Picker Modal */}
      {renderPickerModal(
        showCommunePicker,
        () => { setShowCommunePicker(false); setSearchCommune(''); },
        'Chọn Phường/Xã',
        filteredCommunes,
        searchCommune,
        setSearchCommune,
        handleSelectCommune,
        loadingCommunes
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  content: {
    flex: 1,
    padding: responsiveSpacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressList: {
    gap: responsiveSpacing.md,
  },
  addressCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight.teal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing.sm,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  addressTitle: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  defaultBadge: {
    backgroundColor: colors.highlight.teal,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  addressSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 4,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: responsiveSpacing.sm,
    paddingTop: responsiveSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: responsiveSpacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: responsiveFontSize.caption,
    color: colors.primary.navy,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.md,
  },
  emptySubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.xs,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight.teal,
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: 25,
    marginTop: responsiveSpacing.lg,
    gap: 8,
  },
  addFirstButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: responsiveSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  modalContent: {
    padding: responsiveSpacing.md,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.neutral.background,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  cancelButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.highlight.teal,
  },
  saveButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  formContainer: {
    gap: responsiveSpacing.md,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: responsiveFontSize.body,
    fontWeight: '500',
    color: colors.primary.navy,
  },
  textInput: {
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    minHeight: 48,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    minHeight: 48,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerButtonText: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  pickerPlaceholder: {
    color: colors.neutral.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
  },
  checkboxLabel: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  pickerModalContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: responsiveSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  pickerModalTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    margin: responsiveSpacing.md,
    borderRadius: 12,
    paddingHorizontal: responsiveSpacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  pickerItemText: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  loader: {
    padding: responsiveSpacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    padding: responsiveSpacing.lg,
    color: colors.neutral.textSecondary,
  },
});

export default AddressManagementScreen;
