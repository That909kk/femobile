import { httpClient } from './httpClient';

// Types
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WorkingHours {
  workingHoursId: string;
  employeeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetWorkingHoursRequest {
  employeeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface SetWeeklyWorkingHoursRequest {
  employeeId: string;
  weeklyHours: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
    breakStartTime?: string;
    breakEndTime?: string;
  }>;
}

// Day of week labels in Vietnamese
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

// Day order for sorting
export const DAY_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

class WorkingHoursService {
  private readonly BASE_PATH = '/employee-working-hours';

  /**
   * Lấy khung giờ làm việc của nhân viên
   * @param employeeId - ID của nhân viên
   */
  async getWorkingHours(employeeId: string): Promise<WorkingHours[]> {
    const response = await httpClient.get<WorkingHours[]>(
      `${this.BASE_PATH}/${employeeId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải khung giờ làm việc');
    }

    // Sort by day of week
    const data = Array.isArray(response.data) ? response.data : [];
    return data.sort((a, b) => 
      DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
    );
  }

  /**
   * Cài đặt khung giờ làm việc cho một ngày
   * @param request - Thông tin khung giờ làm việc
   */
  async setWorkingHours(request: SetWorkingHoursRequest): Promise<WorkingHours> {
    const response = await httpClient.post<WorkingHours>(
      this.BASE_PATH,
      request
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể cài đặt khung giờ làm việc');
    }

    return response.data;
  }

  /**
   * Cài đặt khung giờ làm việc cho cả tuần
   * @param request - Thông tin khung giờ cả tuần
   */
  async setWeeklyWorkingHours(request: SetWeeklyWorkingHoursRequest): Promise<WorkingHours[]> {
    const response = await httpClient.post<WorkingHours[]>(
      `${this.BASE_PATH}/weekly`,
      request
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể cài đặt khung giờ làm việc');
    }

    return response.data;
  }

  /**
   * Khởi tạo khung giờ làm việc mặc định (8:00 - 18:00, nghỉ trưa 12:00 - 13:00)
   * @param employeeId - ID của nhân viên
   */
  async initializeDefaultWorkingHours(employeeId: string): Promise<WorkingHours[]> {
    const response = await httpClient.post<WorkingHours[]>(
      `${this.BASE_PATH}/${employeeId}/initialize`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể khởi tạo khung giờ làm việc');
    }

    return response.data;
  }

  /**
   * Sao chép khung giờ làm việc từ ngày này sang ngày khác
   * @param employeeId - ID của nhân viên
   * @param sourceDay - Ngày nguồn
   * @param targetDay - Ngày đích
   */
  async copyWorkingHours(
    employeeId: string,
    sourceDay: DayOfWeek,
    targetDay: DayOfWeek
  ): Promise<WorkingHours> {
    const query = new URLSearchParams();
    query.append('sourceDay', sourceDay);
    query.append('targetDay', targetDay);

    const response = await httpClient.post<WorkingHours>(
      `${this.BASE_PATH}/${employeeId}/copy?${query.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể sao chép khung giờ làm việc');
    }

    return response.data;
  }

  /**
   * Xóa khung giờ làm việc của một ngày (đặt isWorkingDay = false)
   * @param employeeId - ID của nhân viên
   * @param dayOfWeek - Ngày trong tuần
   */
  async disableWorkingDay(employeeId: string, dayOfWeek: DayOfWeek): Promise<WorkingHours> {
    const request: SetWorkingHoursRequest = {
      employeeId,
      dayOfWeek,
      startTime: '08:00',
      endTime: '18:00',
      isWorkingDay: false,
    };

    return this.setWorkingHours(request);
  }

  /**
   * Helper: Format time to display (HH:mm)
   */
  formatTime(time: string | null): string {
    if (!time) return '--:--';
    return time.substring(0, 5);
  }

  /**
   * Helper: Calculate working hours per day
   */
  calculateDailyHours(workingHours: WorkingHours): number {
    if (!workingHours.isWorkingDay) return 0;

    const [startH, startM] = workingHours.startTime.split(':').map(Number);
    const [endH, endM] = workingHours.endTime.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    // Subtract break time if available
    if (workingHours.breakStartTime && workingHours.breakEndTime) {
      const [breakStartH, breakStartM] = workingHours.breakStartTime.split(':').map(Number);
      const [breakEndH, breakEndM] = workingHours.breakEndTime.split(':').map(Number);
      const breakMinutes = (breakEndH * 60 + breakEndM) - (breakStartH * 60 + breakStartM);
      totalMinutes -= breakMinutes;
    }

    return Math.max(0, totalMinutes / 60);
  }

  /**
   * Helper: Calculate total weekly working hours
   */
  calculateWeeklyHours(workingHoursList: WorkingHours[]): number {
    return workingHoursList.reduce((total, wh) => total + this.calculateDailyHours(wh), 0);
  }
}

export const workingHoursService = new WorkingHoursService();
