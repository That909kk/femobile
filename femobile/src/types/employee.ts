// Employee related types

export type EmployeeRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Employee {
  employeeId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: EmployeeStatus;
  address: string;
  rating?: EmployeeRating;
  bio?: string;
  skills?: string[];
  workZones?: WorkZone[];
  availability?: Availability;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'BUSY' | 'AVAILABLE' | 'OFFLINE';

export interface WorkZone {
  zoneId: string;
  zoneName: string;
  city: string;
  district?: string;
  wards?: string[];
}

export interface Availability {
  availabilityId?: string;
  employeeId: string;
  dayOfWeek: number; // 0-6, 0 = Sunday
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  isAvailable: boolean;
}

export interface EmployeeSchedule {
  scheduleId: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  bookingId?: string;
  note?: string;
}

export interface Assignment {
  assignmentId: string;
  bookingId: string;
  employeeId: string;
  serviceId: number;
  status: AssignmentStatus;
  checkInTime?: string;
  checkOutTime?: string;
  note?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    bookingId: string;
    bookingCode: string;
    bookingTime: string;
    customerName: string;
    address: {
      fullAddress: string;
      ward: string;
      city: string;
      latitude?: number;
      longitude?: number;
    };
    totalAmount: number;
    formattedTotalAmount?: string;
    status: string;
  };
  service?: {
    serviceId: number;
    name: string;
    description?: string;
    iconUrl?: string;
  };
}

export type AssignmentStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REJECTED';

export interface EmployeeRequest {
  requestId: string;
  employeeId: string;
  requestType: 'LEAVE' | 'SCHEDULE_CHANGE' | 'ZONE_CHANGE' | 'OTHER';
  requestDate: string;
  startDate?: string;
  endDate?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  responseComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeEarnings {
  employeeId: string;
  totalEarnings: number;
  currentMonthEarnings: number;
  lastMonthEarnings: number;
  completedJobs: number;
  pendingPayments: number;
  earnings: EarningRecord[];
}

export interface EarningRecord {
  earningId: string;
  bookingId: string;
  assignmentId: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
  bookingCode?: string;
  serviceName?: string;
}

export interface AvailableBooking {
  bookingId: string;
  bookingCode: string;
  serviceId: number;
  serviceName: string;
  bookingTime: string;
  address: {
    fullAddress: string;
    ward: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  customerName: string;
  requiredEmployees: number;
  assignedEmployees: number;
  estimatedDuration: string;
  totalAmount: number;
  formattedTotalAmount: string;
  distance?: number;
  isVerified: boolean;
}
