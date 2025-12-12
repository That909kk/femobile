/**
 * Types cho Booking Preview APIs
 * Dựa theo API-Booking-Preview.md
 */

// ============ Request Types ============

export interface BookingPreviewDetailRequest {
  serviceId: number;
  quantity?: number;
  selectedChoiceIds?: number[];
  expectedPrice?: number;
  expectedPricePerUnit?: number;
}

export interface NewAddressRequest {
  customerId?: string;
  fullAddress: string;
  ward: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BookingPreviewRequest {
  customerId?: string;
  addressId?: string;
  newAddress?: NewAddressRequest;
  bookingTime?: string;
  note?: string;
  title?: string;
  promoCode?: string;
  bookingDetails: BookingPreviewDetailRequest[];
  paymentMethodId?: number | null;
  additionalFeeIds?: string[];
}

export interface MultipleBookingPreviewRequest {
  customerId?: string;
  addressId?: string;
  newAddress?: NewAddressRequest;
  bookingTimes: string[];
  note?: string;
  title?: string;
  promoCode?: string;
  bookingDetails: BookingPreviewDetailRequest[];
  paymentMethodId?: number | null;
  additionalFeeIds?: string[];
}

export type RecurrenceType = 'WEEKLY' | 'MONTHLY';

export interface RecurringBookingPreviewRequest {
  customerId?: string;
  addressId?: string;
  newAddress?: NewAddressRequest;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  bookingTime: string;
  startDate: string;
  endDate?: string;
  maxPreviewOccurrences?: number;
  note?: string;
  title?: string;
  promoCode?: string;
  bookingDetails: BookingPreviewDetailRequest[];
  paymentMethodId?: number | null;
  additionalFeeIds?: string[];
}

// ============ Response Types ============

export interface ChoicePreviewItem {
  choiceId: number;
  choiceName: string;
  optionName: string;
  price: number;
  formattedPrice: string;
}

export interface ServicePreviewItem {
  serviceId: number;
  serviceName: string;
  serviceDescription: string;
  iconUrl: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  formattedUnitPrice: string;
  subTotal: number;
  formattedSubTotal: string;
  selectedChoices: ChoicePreviewItem[];
  estimatedDuration: string;
  recommendedStaff: number;
}

export interface AddressPreviewInfo {
  addressId: string;
  fullAddress: string;
  ward: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface PromotionPreviewInfo {
  promotionId: number;
  promoCode: string;
  description: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountValue: number;
  maxDiscountAmount?: number | null;
}

export interface FeeBreakdownItem {
  name: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  amount: number;
  formattedAmount: string;
  systemSurcharge: boolean;
}

export interface BookingPreviewResponse {
  valid: boolean;
  errors: string[];
  
  // Customer Info
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  
  // Address Info
  addressInfo: AddressPreviewInfo | null;
  usingNewAddress: boolean;
  
  // Booking Time
  bookingTime: string | null;
  
  // Service Items
  serviceItems: ServicePreviewItem[] | null;
  totalServices: number;
  totalQuantity: number;
  
  // Subtotal (before discount)
  subtotal: number | null;
  formattedSubtotal: string | null;
  
  // Promotion Info
  promotionInfo: PromotionPreviewInfo | null;
  discountAmount: number | null;
  formattedDiscountAmount: string | null;
  
  // After Discount
  totalAfterDiscount: number | null;
  formattedTotalAfterDiscount: string | null;
  
  // Fees
  feeBreakdowns: FeeBreakdownItem[] | null;
  totalFees: number | null;
  formattedTotalFees: string | null;
  
  // Grand Total
  grandTotal: number | null;
  formattedGrandTotal: string | null;
  
  // Additional Info
  estimatedDuration: string | null;
  recommendedStaff: number;
  note: string | null;
  paymentMethodId: number | null;
  paymentMethodName: string | null;
}

export interface MultipleBookingPreviewResponse {
  valid: boolean;
  errors: string[];
  bookingCount: number;
  
  // Shared Service Info
  serviceItems: ServicePreviewItem[];
  totalServices: number;
  totalQuantityPerBooking: number;
  subtotalPerBooking: number;
  formattedSubtotalPerBooking: string;
  
  // Customer & Address Info
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressInfo: AddressPreviewInfo;
  usingNewAddress: boolean;
  
  // Fees & Promotion
  feeBreakdowns: FeeBreakdownItem[];
  totalFeesPerBooking: number;
  formattedTotalFeesPerBooking: string;
  
  promotionInfo: PromotionPreviewInfo | null;
  discountPerBooking: number;
  formattedDiscountPerBooking: string;
  
  pricePerBooking: number;
  formattedPricePerBooking: string;
  
  // Individual booking previews
  bookingPreviews: BookingPreviewResponse[];
  
  // Aggregated Totals
  totalEstimatedPrice: number;
  formattedTotalEstimatedPrice: string;
  totalEstimatedDuration: string;
  
  // Validation summary
  validBookingsCount: number;
  invalidBookingsCount: number;
  invalidBookingTimes: string[];
  
  // Payment Info
  paymentMethodId: number | null;
  paymentMethodName: string | null;
}

export interface RecurringBookingPreviewResponse {
  valid: boolean;
  errors: string[];
  
  // Recurring Info
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  recurrenceDaysDisplay: string;
  recurrenceDescription?: string;
  bookingTime: string;
  startDate: string;
  endDate: string | null;
  
  // Generated Occurrences
  totalOccurrences: number;
  occurrenceCount?: number;
  previewedOccurrences: number;
  maxPreviewOccurrences?: number;
  occurrenceDates: string[];
  plannedBookingTimes?: string[];
  hasMoreOccurrences?: boolean;
  
  // Service & Price Info
  serviceItems: ServicePreviewItem[];
  totalServices?: number;
  totalQuantityPerOccurrence?: number;
  
  // Subtotal per occurrence (trước phí)
  subtotalPerOccurrence?: number;
  formattedSubtotalPerOccurrence?: string;
  
  // Price per occurrence (sau phí)
  pricePerOccurrence: number;
  formattedPricePerOccurrence: string;
  totalEstimatedPrice: number;
  formattedTotalEstimatedPrice: string;
  
  // Customer & Address
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  addressInfo: AddressPreviewInfo;
  usingNewAddress: boolean;
  
  // Fees & Promotion
  feeBreakdowns: FeeBreakdownItem[];
  totalFeesPerOccurrence?: number;
  formattedTotalFeesPerOccurrence?: string;
  
  promotionInfo: PromotionPreviewInfo | null;
  discountPerOccurrence?: number;
  formattedDiscountPerOccurrence?: string;
  
  // Payment
  paymentMethodId: number | null;
  paymentMethodName: string | null;
}
