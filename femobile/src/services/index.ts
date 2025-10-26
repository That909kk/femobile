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

export type { UserInfo, CustomerData, EmployeeData } from './userInfoService';

export type { 
  EmployeeRequest,
  RequestStatus,
  RequestActionResponse
} from './employeeRequestService';

export type {
  EmployeeSchedule,
  ScheduleStatus,
  ScheduleStats
} from './employeeScheduleService';

export type { 
  Address, 
  NewAddress, 
  Assignment,
  CustomerBookingsResponse
} from './bookingService';

export type { Province, Commune } from './addressService';

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
} from './employeeAssignmentService';
