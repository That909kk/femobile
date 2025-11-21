export { authService } from './authService';
export { httpClient } from './httpClient';
export { userInfoService } from './userInfoService';
export { bookingService } from './bookingService';
export { serviceService } from './serviceService';
export { categoryService } from './categoryService';
export { employeeRequestService } from './employeeRequestService';
export { employeeScheduleService } from './employeeScheduleService';
export { paymentService } from './paymentService';
export { employeeAssignmentService } from './employeeAssignmentService';
export { addressService } from './addressService';
export { reviewService } from './reviewService';
export { notificationService } from './notificationService';
export { notificationWebSocketService } from './notificationWebSocketService';
export { uploadService } from './uploadService';
export { chatService } from './chatService';
export { bookingMediaService } from './bookingMediaService';
export { customerService } from './customerService';
export { employeeService } from './employeeService';
export { websocketService } from './websocketService';
export { recurringBookingService } from './recurringBookingService';

export type { UserInfo, CustomerData, EmployeeData, UpdateCustomerRequest, UpdateEmployeeRequest } from './userInfoService';

export type { 
  EmployeeRequest,
  RequestStatus,
  RequestActionResponse
} from './employeeRequestService';

export type {
  EmployeeSchedule,
  ScheduleStatus,
  ScheduleStats,
  TimeSlot,
  TimeSlotType,
  WorkingZone,
  EmployeeScheduleData,
  EmployeeScheduleResponse,
} from './employeeScheduleService';

export type { 
  Address, 
  NewAddress, 
  Assignment,
  CustomerBookingsResponse
} from './bookingService';

export type { Province, Commune } from './addressService';

export type { UploadImageResponse } from './uploadService';

// Export booking types from types folder
export type {
  BookingDetail,
  BookingRequest, 
  BookingResponse,
  PaymentMethod,
  BookingValidationRequest,
  BookingValidationResponse,
  ServiceChoice,
  BookingAddress,
  NewBookingAddress,
  BookingAssignment,
  BookingEmployee,
  BookingServiceDetail,
  BookingPaymentInfo
} from '../types/booking';

export type {
  Service,
  ServiceOption,
  ServiceChoice as ServiceOptionChoice,
  ServicePriceRequest,
  ServicePriceResponse,
  SuitableEmployee as Employee,
  Category,
  CategoryService
} from './serviceService';

export type {
  PaymentRecord,
  PaymentHistoryResponse,
} from './paymentService';
export type {
  EmployeeAssignment,
  AssignmentStatus,
  AvailableBookingDetail,
  AvailableBookingsResponse,
  AcceptBookingResponse,
  CheckInResponse,
  CheckOutResponse,
  CancelAssignmentRequest,
} from './employeeAssignmentService';

export type {
  ReviewCriterion,
  ReviewRating,
  CreateReviewRequest,
  Review,
  EmployeeReviewSummary,
} from './reviewService';

export type {
  Notification,
  NotificationType,
  NotificationPriority,
  RelatedType,
  NotificationListResponse,
  UnreadCountResponse,
  NotificationResponse,
} from './notificationService';

export type {
  RecurringBookingResponse,
  RecurringBookingListPayload,
  RecurringBookingRequest,
  CancelRecurringBookingRequest,
} from '../types/recurringBooking';
