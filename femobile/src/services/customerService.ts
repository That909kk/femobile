import { httpClient } from './httpClient';

export interface CustomerAddress {
  addressId: string;
  fullAddress: string;
  ward: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface Customer {
  customerId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  isMale?: boolean;
  birthdate?: string;
  rating?: 'HIGH' | 'MEDIUM' | 'LOW';
  vipLevel?: number;
  account?: {
    accountId: string;
    phoneNumber: string;
    status: string;
    isPhoneVerified: boolean;
    lastLogin: string;
    roles: string[];
  };
  addresses?: CustomerAddress[];
}

export interface CreateAddressRequest {
  customerId: string;
  fullAddress: string;
  ward: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  fullAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

class CustomerService {
  private readonly BASE_PATH = '/customer';

  /**
   * Get customer addresses
   */
  async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    const response = await httpClient.get<CustomerAddress[]>(
      `${this.BASE_PATH}/${customerId}/addresses`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the lay danh sach dia chi');
    }

    return response.data;
  }

  /**
   * Create new address for customer
   */
  async createAddress(addressData: CreateAddressRequest): Promise<CustomerAddress> {
    const response = await httpClient.post<CustomerAddress>(
      `${this.BASE_PATH}/${addressData.customerId}/addresses`,
      addressData,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tao dia chi moi');
    }

    return response.data;
  }

  /**
   * Update existing address
   */
  async updateAddress(
    customerId: string,
    addressId: string,
    updates: UpdateAddressRequest,
  ): Promise<CustomerAddress> {
    const response = await httpClient.put<CustomerAddress>(
      `${this.BASE_PATH}/${customerId}/addresses/${addressId}`,
      updates,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the cap nhat dia chi');
    }

    return response.data;
  }

  /**
   * Delete address
   */
  async deleteAddress(customerId: string, addressId: string): Promise<boolean> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/${customerId}/addresses/${addressId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the xoa dia chi');
    }

    return response.data?.success ?? response.success;
  }

  /**
   * Set default address
   */
  async setDefaultAddress(customerId: string, addressId: string): Promise<boolean> {
    const response = await httpClient.put<{ success: boolean; message: string }>(
      `${this.BASE_PATH}/${customerId}/addresses/${addressId}/set-default`,
      {},
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the dat dia chi mac dinh');
    }

    return response.data?.success ?? response.success;
  }
}

export const customerService = new CustomerService();
