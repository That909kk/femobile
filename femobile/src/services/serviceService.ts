import { httpClient } from './httpClient';
import { 
  ServiceOptionsResponse, 
  CalculatePriceRequest, 
  CalculatePriceResponse 
} from '../types/booking';

// Service Types
export interface Service {
  serviceId: number;
  name: string;
  description: string;
  basePrice: number;
  formattedPrice: string;
  unit: string;
  estimatedDurationHours: number;
  iconUrl: string;
  categoryName: string;
  isActive: boolean;
  recommendedStaff: number;
}

export interface ServiceOption {
  optionId: number;
  optionName: string;
  optionType: 'RADIO' | 'CHECKBOX' | 'SELECT';
  isRequired: boolean;
  choices: ServiceChoice[];
}

export interface ServiceChoice {
  choiceId: number;
  choiceName: string;
  priceAdjustment: number;
  formattedPriceAdjustment: string;
  staffAdjustment?: number;
  durationAdjustmentHours?: number;
}

export interface ServicePriceRequest {
  serviceId: number;
  quantity: number;
  selectedChoiceIds?: number[];
}

export interface ServicePriceResponse {
  service: Service;
  quantity: number;
  unitPrice: number;
  formattedUnitPrice: string;
  totalPrice: number;
  formattedTotalPrice: string;
  totalDurationHours: number;
  formattedDuration: string;
  recommendedStaff: number;
  selectedChoices: ServiceChoice[];
  priceBreakdown: {
    basePrice: number;
    adjustments: Array<{
      choiceId: number;
      choiceName: string;
      adjustment: number;
    }>;
  };
}

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  iconUrl: string;
  isActive: boolean;
  serviceCount?: number;
  services?: CategoryService[];
}

export interface CategoryService {
  serviceId: number;
  serviceName: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedDurationHours: number;
  iconUrl: string;
  categoryName: string;
  isActive: boolean;
  recommendedStaff: number;
}

export interface SuitableEmployee {
  employeeId: string;
  fullName: string;
  avatar: string;
  skills: string[];
  rating: string;
  status: string;
  workingWards: string[];
  workingCity: string;
  completedJobs: number;
}

export interface ServiceSearchParams {
  keyword?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

class ServiceService {
  private readonly BASE_PATH = '/customer/services';

  /**
   * Get all active services
   */
  async getAllServices() {
    const response = await httpClient.get<Service[]>(this.BASE_PATH);
    return response;
  }

  /**
   * Get customer services (alias for mobile app)
   */
  async getCustomerServices() {
    return this.getAllServices();
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: number) {
    const response = await httpClient.get<Service>(`${this.BASE_PATH}/${serviceId}`);
    return response;
  }

  /**
   * Search services by keyword
   */
  async searchServices(params: ServiceSearchParams) {
    // Build URL manually to avoid encoding Vietnamese keywords
    const queryParts: string[] = [];
    if (params.keyword) queryParts.push(`keyword=${params.keyword}`);
    if (params.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
    if (params.minPrice) queryParts.push(`minPrice=${params.minPrice}`);
    if (params.maxPrice) queryParts.push(`maxPrice=${params.maxPrice}`);
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);

    const url = `${this.BASE_PATH}/search${queryParts.length > 0 ? '?' + queryParts.join('&') : ''}`;
    
    const response = await httpClient.get<{
      services: Service[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
    }>(url);
    return response;
  }

  /**
   * Get service count
   */
  async getServiceCount() {
    const response = await httpClient.get<{ totalServices: number; activeServices: number }>(`${this.BASE_PATH}/count`);
    return response;
  }

  /**
   * Get service options for a specific service
   */
  async getServiceOptions(serviceId: number) {
    const response = await httpClient.get<ServiceOptionsResponse>(
      `/customer/services/${serviceId}/options`
    );
    return response;
  }

  /**
   * Calculate service price with new API
   */
  async calculateServicePrice(priceRequest: CalculatePriceRequest) {
    const response = await httpClient.post<CalculatePriceResponse>(
      '/customer/services/calculate-price',
      priceRequest
    );
    return response;
  }

  /**
   * Find suitable employees for service
   */
  async findSuitableEmployees(params: {
    serviceId: number;
    bookingTime: string;
    district: string;
    city: string;
  }) {
    // Build URL manually without encoding Vietnamese characters
    const url = `${this.BASE_PATH}/suitable?serviceId=${params.serviceId}&bookingTime=${params.bookingTime}&district=${params.district}&city=${params.city}`;
    
    const response = await httpClient.get<{
      employees: SuitableEmployee[];
      totalAvailable: number;
      serviceRequirement: {
        serviceId: number;
        serviceName: string;
        recommendedStaff: number;
        estimatedDuration: string;
      };
    }>(url);
    return response;
  }

  /**
   * Get suitable employees for service (new API)
   */
  async getSuitableEmployees(params: {
    serviceId: number;
    bookingTime: string;
    ward: string;
    city: string;
  }) {
    // Build URL manually without encoding Vietnamese characters
    const url = `${this.BASE_PATH}/employee/suitable?serviceId=${params.serviceId}&bookingTime=${params.bookingTime}&ward=${params.ward}&city=${params.city}`;
    
    const response = await httpClient.get<SuitableEmployee[]>(url);
    return response;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const response = await httpClient.get<Array<{
      categoryId: number;
      categoryName: string;
      description: string;
      iconUrl: string;
      isActive: boolean;
      serviceCount: number;
    }>>('/customer/categories');
    return response;
  }

  /**
   * Get category with services
   */
  async getCategoryServices(categoryId: number) {
    const response = await httpClient.get<{
      categoryId: number;
      categoryName: string;
      description: string;
      iconUrl: string;
      services: Array<{
        serviceId: number;
        name: string;
        description: string;
        basePrice: number;
        formattedPrice: string;
        unit: string;
        estimatedDurationHours: number;
        iconUrl: string;
        categoryName: string;
        isActive: boolean;
        recommendedStaff: number;
      }>;
    }>(`/customer/categories/${categoryId}/services`);
    return response;
  }
}

export const serviceService = new ServiceService();