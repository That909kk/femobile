export * from './auth';
export * from './booking';
export type {
	Service,
	ServiceCategory,
	EmployeeSchedule,
} from './service';
export * from './recurringBooking';

// Employee types
export type {
  Employee,
  EmployeeRating,
  WorkZone,
  Availability,
  Assignment,
  AssignmentStatus,
  EmployeeRequest,
  EmployeeEarnings,
  EarningRecord,
  AvailableBooking,
} from './employee';

export * from './customer';
export * from './notification';
export * from './chat';

// Payment types (exclude duplicates from booking: PaymentMethod, PaymentStatus)
export type {
  Payment,
  PaymentRequest,
  VNPayPaymentRequest,
  VNPayPaymentResponse,
  VNPayCallbackParams,
  PaymentHistory,
  PaymentConfirmation,
} from './payment';

// Review types (note: Review is already exported from service)
export type {
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewList,
  ReviewSummary,
} from './review';