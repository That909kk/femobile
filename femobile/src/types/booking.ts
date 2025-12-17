// Booking related types and interfaces

// Service Options and Price Calculation
export interface ServiceChoice {
  choiceId: number;
  choiceName: string;
  displayOrder: number;
  isDefault: boolean;
}

export interface ServiceOption {
  optionId: number;
  optionName: string;
  optionType: 'SINGLE_CHOICE_RADIO' | 'MULTIPLE_CHOICE_CHECKBOX' | 'SINGLE_CHOICE_DROPDOWN' | 'QUANTITY_INPUT';
  displayOrder: number;
  isRequired: boolean;
  parentChoiceId?: number;
  choices: ServiceChoice[];
}

export interface ServiceOptionsResponse {
  serviceId: number;
  serviceName: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedDurationHours: number;
  recommendedStaff: number;
  iconUrl: string;
  formattedPrice: string;
  formattedDuration: string;
  options: ServiceOption[];
}

export interface CalculatePriceRequest {
  serviceId: number;
  selectedChoiceIds: number[];
  quantity?: number;
}

export interface CalculatePriceResponse {
  serviceId: number;
  serviceName: string;
  basePrice?: number;
  totalAdjustment?: number;
  finalPrice: number;
  suggestedStaff: number;
  estimatedDurationHours?: number;
  estimatedDuration?: number;
  formattedPrice: string;
  formattedDuration: string;
}

export interface BookingAddress {
  addressId?: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

// Default address API response structure
export interface DefaultAddressResponse {
  addressId: string;
  customer: {
    customerId: string;
    account: {
      accountId: string;
      username: string;
      phoneNumber: string;
      status: string;
      isPhoneVerified: boolean;
      roles: Array<{
        roleId: number;
        roleName: string;
      }>;
    };
    avatar: string;
    fullName: string;
    isMale: boolean;
    email: string;
    birthdate: string;
    rating: string | null;
    vipLevel: string | null;
  };
  fullAddress: string;
  ward: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface NewBookingAddress {
  customerId: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingDetail {
  serviceId: number;
  quantity: number;
  expectedPrice: number;
  expectedPricePerUnit: number;
  selectedChoiceIds: number[];
}

export interface BookingAssignment {
  serviceId: number;
  employeeId: string;
}

export interface BookingRequest {
  addressId?: string;
  newAddress?: NewBookingAddress | null;
  bookingTime: string;
  note?: string;
  promoCode?: string | null;
  bookingDetails: BookingDetail[];
  assignments?: BookingAssignment[] | null;
  paymentMethodId: number;
  title?: string;
  imageUrl?: string;
}

// Multiple bookings request (for multiple time slots)
export interface MultipleBookingsRequest {
  addressId?: string;
  newAddress?: NewBookingAddress | null;
  bookingTimes: string[]; // Array of booking times
  note?: string;
  promoCode?: string | null;
  bookingDetails: BookingDetail[];
  assignments?: BookingAssignment[] | null;
  paymentMethodId: number;
  title?: string;
}

// Multiple bookings response
export interface MultipleBookingsResponse {
  totalBookingsCreated: number;
  successfulBookings: number;
  failedBookings: number;
  totalAmount: number;
  formattedTotalAmount: string;
  bookings: BookingResponse[];
  errors: Array<{
    bookingTime: string;
    error: string;
  }>;
}

export interface BookingValidationRequest {
  addressId?: string;
  newAddress?: NewBookingAddress | null;
  bookingTime: string;
  note?: string;
  promoCode?: string | null;
  bookingDetails: BookingDetail[];
  assignments?: BookingAssignment[] | null;
  paymentMethodId: number;
}

export interface PaymentMethod {
  methodId: number;
  methodCode: string;
  methodName: string;
  description?: string;
}

export interface ServiceChoice {
  choiceId: number;
  choiceName: string;
  optionName: string;
  priceAdjustment: number;
  formattedPriceAdjustment: string;
}

export interface BookingEmployee {
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  rating?: number;
  employeeStatus: string;
  skills: string[];
  bio: string;
  workingWards?: string[];
  workingCity?: string;
  hasWorkedWithCustomer?: boolean;
  completedJobs?: number;
  recommendation?: {
    score: number;
  };
}

export interface BookingServiceDetail {
  bookingDetailId: string;
  service: {
    serviceId: number;
    name: string;
    description: string;
    basePrice: number;
    unit: string;
    estimatedDurationHours: number;
    iconUrl: string;
    categoryName: string;
    isActive: boolean;
  };
  quantity: number;
  pricePerUnit: number;
  formattedPricePerUnit: string;
  subTotal: number;
  formattedSubTotal: string;
  selectedChoices: ServiceChoice[];
  assignments: Array<{
    assignmentId: string;
    employee: BookingEmployee;
    status: string;
  }>;
  duration: string;
  formattedDuration: string;
}

export interface BookingPaymentInfo {
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod | string | null;
  paymentStatus: string;
  transactionCode: string | null;
  createdAt: string;
  paidAt?: string | null;
}

// Fee item interface for booking - giống web
export interface BookingFeeItem {
  name: string;
  type: string;
  value: number;
  amount: number;
  systemSurcharge?: boolean;
}

export interface BookingResponse {
  bookingId: string;
  bookingCode: string;
  customerId?: string;
  customerName?: string;
  status: string;
  totalAmount: number;
  formattedTotalAmount: string;
  bookingTime: string;
  createdAt: string;
  note?: string;
  title?: string;
  imageUrl?: string;
  imageUrls?: string[];
  isVerified?: boolean;
  cancelReason?: string;
  adminComment?: string;
  // Fee & Pricing fields - giống web
  baseAmount?: number;
  totalFees?: number;
  fees?: BookingFeeItem[];
  address?: {
    addressId: string;
    fullAddress: string;
    ward: string;
    district: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  };
  customerInfo?: {
    addressId: string;
    fullAddress: string;
    ward: string;
    district: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  };
  serviceDetails?: BookingServiceDetail[];
  bookingDetails?: BookingServiceDetail[];
  paymentInfo?: BookingPaymentInfo;
  payment?: BookingPaymentInfo | null;
  promotionApplied?: any;
  promotion?: any;
  assignedEmployees?: BookingEmployee[];
  totalServices?: number;
  totalEmployees?: number;
  estimatedDuration?: string;
  hasPromotion?: boolean;
}

export interface BookingConflict {
  conflictType: string;
  employeeId: string;
  conflictStartTime: string;
  conflictEndTime: string;
  reason: string;
}

export interface ServiceValidation {
  serviceId: number;
  serviceName: string;
  exists: boolean;
  active: boolean;
  basePrice: number;
  calculatedPrice: number;
  expectedPrice: number;
  priceMatches: boolean;
  validChoiceIds: number[];
  invalidChoiceIds: number[];
  recommendedStaff: number;
  valid: boolean;
}

export interface BookingValidationResponse {
  valid?: boolean; // Some APIs return 'valid'
  isValid?: boolean; // Others return 'isValid'
  calculatedTotalAmount: number | null;
  formattedTotalAmount?: string;
  errors: string[];
  conflicts: BookingConflict[];
  serviceValidations: ServiceValidation[];
  customer: {
    customerId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  } | null;
  address: {
    addressId: string;
    fullAddress: string;
    ward: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  } | null;
  usingNewAddress: boolean;
}

// Booking status types
export type BookingStatus = 
  | 'PENDING' 
  | 'AWAITING_EMPLOYEE' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

// Payment status types
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// Employee status types
export type EmployeeStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'INACTIVE';