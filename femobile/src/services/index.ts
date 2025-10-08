export { authService } from './authService';
export { httpClient } from './httpClient';
export { userInfoService } from './userInfoService';
export { bookingService } from './bookingService';
export { serviceService } from './serviceService';
export { categoryService } from './categoryService';
export { employeeRequestService } from './employeeRequestService';
export { employeeScheduleService } from './employeeScheduleService';
export { employeeDashboardService } from './employeeDashboardService';
export { customerDashboardService } from './customerDashboardService';

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
  Assignment
} from './bookingService';

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
  EmployeeDashboardStats,
  NextAppointment,
  RecentActivity
} from './employeeDashboardService';

export type {
  CustomerDashboardStats,
  UpcomingBooking,
  RecentBooking
} from './customerDashboardService';