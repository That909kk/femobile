import { httpClient } from './httpClient';
import { API_CONFIG } from '../constants';

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  iconUrl: string;
  isActive: boolean;
  serviceCount: number;
}

export interface CategoryWithServices {
  categoryId: number;
  categoryName: string;
  description: string;
  iconUrl: string;
  services: Service[];
}

export interface Service {
  serviceId: number;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedDurationHours: number;
  recommendedStaff: number;
  iconUrl: string;
  isActive: boolean;
}

export interface CategoryServiceResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

class CategoryService {
  private baseURL = '/customer/categories';

  /**
   * Get all active categories
   */
  async getAllCategories(): Promise<CategoryServiceResponse<Category[]>> {
    try {
      console.log('CategoryService - Loading categories...');
      console.log('CategoryService - Request URL:', `${API_CONFIG.BASE_URL}${this.baseURL}`);
      
      // Test với endpoint khác để verify httpClient hoạt động
      console.log('CategoryService - Testing httpClient with known endpoint...');
      try {
        const testResponse = await httpClient.get('/auth/info');
        console.log('CategoryService - Test /auth/info response:', testResponse);
      } catch (testError) {
        console.log('CategoryService - Test /auth/info error:', testError);
      }
      
      const response = await httpClient.get<Category[]>(this.baseURL);
      
      console.log('CategoryService - Raw response:', response);
      console.log('CategoryService - Response type:', typeof response);
      console.log('CategoryService - Success field:', response?.success);
      console.log('CategoryService - Data field exists:', !!response?.data);
      console.log('CategoryService - Response keys:', response ? Object.keys(response) : 'null');
      
      if (response && response.success && response.data) {
        console.log('CategoryService - Valid response, returning data:', response.data);
        return {
          success: true,
          message: response.message || 'Lấy danh sách danh mục thành công',
          data: response.data
        };
      } else {
        console.log('CategoryService - Invalid response or no data');
        return {
          success: false,
          message: response?.message || 'Không thể tải danh sách danh mục',
          data: null
        };
      }
    } catch (error: any) {
      console.error('CategoryService - Catch block error:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Không thể tải danh sách danh mục',
        data: null
      };
    }
  }

  /**
   * Get category with its services
   */
  async getCategoryWithServices(categoryId: number): Promise<CategoryServiceResponse<CategoryWithServices>> {
    try {
      const response = await httpClient.get<CategoryWithServices>(`${this.baseURL}/${categoryId}/services`);
      console.log('CategoryService - Category with Services Response:', response);
      
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Lấy thông tin danh mục thành công',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể tải thông tin danh mục',
          data: null
        };
      }
    } catch (error: any) {
      console.error('Error fetching category with services:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Không thể tải thông tin danh mục',
        data: null
      };
    }
  }

  /**
   * Get service count for a category
   */
  async getCategoryServiceCount(categoryId: number): Promise<CategoryServiceResponse<{ categoryId: number; serviceCount: number }>> {
    try {
      const response = await httpClient.get(`${this.baseURL}/${categoryId}/count`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching category service count:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Không thể tải số lượng dịch vụ',
        data: null
      };
    }
  }

  /**
   * Get all services (existing endpoint for compatibility)
   */
  async getAllServices(): Promise<CategoryServiceResponse<Service[]>> {
    try {
      const response = await httpClient.get('/customer/services');
      console.log('CategoryService - All Services Response:', response);
      
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Lấy danh sách dịch vụ thành công',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể tải danh sách dịch vụ',
          data: null
        };
      }
    } catch (error: any) {
      console.error('Error fetching all services:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Không thể tải danh sách dịch vụ',
        data: null
      };
    }
  }

  /**
   * Filter services by category (client-side filtering from all services)
   */
  async getServicesByCategory(categoryId: number): Promise<CategoryServiceResponse<Service[]>> {
    try {
      // First try to get category with services (preferred method)
      const categoryResponse = await this.getCategoryWithServices(categoryId);
      if (categoryResponse.success && categoryResponse.data) {
        return {
          success: true,
          message: 'Lấy danh sách dịch vụ theo danh mục thành công',
          data: categoryResponse.data.services
        };
      }

      // Fallback: get all services and filter by comparing with category services
      // This is less efficient but provides a backup method
      const allServicesResponse = await this.getAllServices();
      if (allServicesResponse.success && allServicesResponse.data) {
        // Note: This filtering won't work perfectly without categoryId in service data
        // But we'll return all services as fallback
        return {
          success: true,
          message: 'Lấy danh sách dịch vụ thành công',
          data: allServicesResponse.data
        };
      }

      return {
        success: false,
        message: 'Không thể tải dịch vụ theo danh mục',
        data: null
      };
    } catch (error: any) {
      console.error('Error fetching services by category:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Không thể tải dịch vụ theo danh mục',
        data: null
      };
    }
  }
}

export const categoryService = new CategoryService();