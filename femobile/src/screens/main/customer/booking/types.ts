// Common types for booking flow
export enum BookingStep {
  SERVICE_SELECTION = 1,
  LOCATION_SELECTION = 2,
  TIME_SELECTION = 3,
  EMPLOYEE_SELECTION = 4,
  CONFIRMATION = 5,
  SUCCESS = 6,
}

// Booking mode types
export type BookingMode = 'single' | 'multiple' | 'recurring';

// Recurring booking configuration
export interface RecurringBookingConfig {
  recurrenceType: 'WEEKLY' | 'MONTHLY';
  recurrenceDays: number[]; // 1-7 for WEEKLY (Mon-Sun), 1-31 for MONTHLY
  bookingTime: string; // HH:mm:ss format
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (optional)
}

// Post booking data (for creating post with images)
export interface PostBookingData {
  title: string;
  images: Array<{
    uri: string;
    name: string;
    type: string;
  }>;
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