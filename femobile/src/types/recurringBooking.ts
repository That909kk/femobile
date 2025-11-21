import type { NewBookingAddress } from './booking';

export type RecurrenceType = 'WEEKLY' | 'MONTHLY';
export type RecurringBookingStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface RecurringBookingServiceItem {
  serviceId: number;
  name: string;
  description?: string;
  basePrice?: number;
  unit?: string;
  estimatedDurationHours?: number;
  iconUrl?: string;
  categoryName?: string;
  isActive?: boolean;
}

export interface RecurringBookingDetailItem {
  bookingDetailId: string;
  service: RecurringBookingServiceItem;
  quantity: number;
  pricePerUnit?: number;
  formattedPricePerUnit?: string;
  subTotal?: number;
  formattedSubTotal?: string;
  selectedChoices?: Array<{ choiceId: number; choiceName: string }>;
  duration?: string;
  formattedDuration?: string;
}

export interface RecurringBookingAddress {
  addressId: string;
  fullAddress: string;
  ward: string;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface RecurringBookingCustomer {
  customerId: string;
  fullName: string;
  avatar?: string;
  email?: string;
  phoneNumber?: string;
  isMale?: boolean;
  birthdate?: string;
  rating?: number | null;
  vipLevel?: string | null;
}

export interface RecurringBookingResponse {
  recurringBookingId: string;
  customerId: string;
  customerName?: string;
  customer?: RecurringBookingCustomer;
  address?: RecurringBookingAddress;
  recurrenceType: RecurrenceType;
  recurrenceTypeDisplay?: string;
  recurrenceDays: number[];
  recurrenceDaysDisplay?: string;
  bookingTime: string;
  startDate: string;
  endDate?: string;
  note?: string;
  title?: string;
  promotion?: any;
  recurringBookingDetails: RecurringBookingDetailItem[];
  status: RecurringBookingStatus;
  statusDisplay?: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  totalGeneratedBookings?: number;
  upcomingBookings?: number | null;
}

export interface RecurringBookingListPayload {
  data: RecurringBookingResponse[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface RecurringBookingRequestDetail {
  serviceId: number;
  quantity: number;
  selectedChoiceIds?: number[];
}

export interface RecurringBookingRequest {
  addressId?: string;
  newAddress?: NewBookingAddress | null;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  bookingTime: string; // HH:mm:ss
  startDate: string; // yyyy-MM-dd
  endDate?: string;
  note?: string;
  title?: string;
  promoCode?: string | null;
  bookingDetails: RecurringBookingRequestDetail[];
}

export interface CancelRecurringBookingRequest {
  reason?: string;
}
