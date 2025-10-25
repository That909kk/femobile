// Service types
export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice?: number;
  duration?: number;
  image?: string;
  categoryId?: string;
  isNew?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOption {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  description?: string;
  isRequired: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  services?: Service[];
}

// Employee types
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  skills?: string[];
  rating?: number;
  totalReviews?: number;
  isActive: boolean;
  isAvailable: boolean;
  experience?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSchedule {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  bookingId?: string;
}

// Review types
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  employeeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export default {
  Service,
  ServiceOption,
  ServiceCategory,
  Employee,
  EmployeeSchedule,
  Review,
};