// Common types for booking flow
export enum BookingStep {
  SERVICE_SELECTION = 1,
  LOCATION_SELECTION = 2,
  TIME_SELECTION = 3,
  EMPLOYEE_SELECTION = 4,
  CONFIRMATION = 5,
  SUCCESS = 6,
}

export interface LocationData {
  id?: number;
  addressId?: string | number;
  address?: string;
  fullAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  isDefault?: boolean;
  isProfileAddress?: boolean;
  contactInfo?: {
    fullName: string;
    phoneNumber: string;
  };
}

export interface SelectedOption {
  optionId: number;
  choiceId: number;
  optionName: string;
  choiceName: string;
  priceAdjustment: number;
}