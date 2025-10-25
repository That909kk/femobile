import { httpClient } from './httpClient';

export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EmployeeAssignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  status: AssignmentStatus;
  estimatedDuration: number;
  price: number;
  notes?: string;
}

export interface AssignmentListResponse {
  success: boolean;
  message: string;
  data: EmployeeAssignment[];
  totalItems?: number;
}

class EmployeeAssignmentService {
  private readonly BASE_PATH = '/employee';

  async getAssignments(
    employeeId: string,
    params?: { status?: AssignmentStatus; page?: number; size?: number; sort?: string },
  ): Promise<EmployeeAssignment[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());
    if (params?.sort) query.append('sort', params.sort);

    const endpoint = `${this.BASE_PATH}/${employeeId}/assignments${
      query.toString() ? `?${query.toString()}` : ''
    }`;

    const response = await httpClient.get<AssignmentListResponse>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach cong viec');
    }

    return response.data;
  }
}

export const employeeAssignmentService = new EmployeeAssignmentService();
