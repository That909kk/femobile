// Customer related types

export type CustomerRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Customer {
  customerId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: CustomerStatus;
  address: string;
  birthdate?: string;
  rating?: CustomerRating;
  vipLevel?: number;
  totalBookings?: number;
  completedBookings?: number;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface CustomerAddress {
  addressId: string;
  customerId: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  label?: string; // e.g., "Home", "Office"
  createdAt: string;
}

export interface CreateAddressRequest {
  customerId: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  label?: string;
}

export interface UpdateAddressRequest {
  fullAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  label?: string;
}

export interface CustomerProfile extends Customer {
  addresses: CustomerAddress[];
  favoriteServices: number[];
  preferences: CustomerPreferences;
}

export interface CustomerPreferences {
  preferredEmployees: string[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  languagePreference: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface UpdateCustomerProfileRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  isMale?: boolean;
  birthdate?: string;
  avatar?: string;
}
