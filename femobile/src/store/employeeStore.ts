import { create } from 'zustand';
import {
  EmployeeAssignment,
  AvailableBookingDetail,
  AssignmentStatus as ServiceAssignmentStatus,
} from '../services/employeeAssignmentService';
import { TimeSlot } from '../services/employeeScheduleService';
import { employeeAssignmentService, employeeScheduleService, bookingService } from '../services';

interface EmployeeState {
  // Assignments
  assignments: EmployeeAssignment[];
  currentAssignment: EmployeeAssignment | null;
  
  // Available bookings
  availableBookings: AvailableBookingDetail[];
  
  // Schedule
  schedule: TimeSlot[];
  
  // Loading states
  loading: boolean;
  loadingBookings: boolean;
  loadingSchedule: boolean;
  
  // Error
  error: string | null;
  
  // Pagination
  page: number;
  hasMore: boolean;
}

interface EmployeeActions {
  // Assignment actions
  fetchMyAssignments: (employeeId: string, params?: {
    status?: ServiceAssignmentStatus;
    page?: number;
    size?: number;
  }) => Promise<void>;
  acceptBookingDetail: (detailId: string, employeeId: string) => Promise<void>;
  cancelAssignment: (assignmentId: string, employeeId: string, reason: string) => Promise<void>;
  checkIn: (assignmentId: string, employeeId: string, imageFile?: any) => Promise<void>;
  checkOut: (assignmentId: string, employeeId: string, imageFile?: any) => Promise<void>;
  
  // Available bookings actions
  fetchAvailableBookings: (employeeId: string, params?: { page?: number; size?: number }) => Promise<void>;
  
  // Schedule actions
  fetchSchedule: (employeeId: string, startDate: Date, endDate: Date) => Promise<void>;
  fetchTodaySchedule: (employeeId: string) => Promise<void>;
  
  // State management
  setCurrentAssignment: (assignment: EmployeeAssignment | null) => void;
  clearError: () => void;
  clearAssignments: () => void;
}

export const useEmployeeStore = create<EmployeeState & EmployeeActions>((set, get) => ({
  // Initial state
  assignments: [],
  currentAssignment: null,
  availableBookings: [],
  schedule: [],
  loading: false,
  loadingBookings: false,
  loadingSchedule: false,
  error: null,
  page: 0,
  hasMore: true,

  // Fetch my assignments
  fetchMyAssignments: async (employeeId: string, params = {}) => {
    try {
      set({ loading: true, error: null });
      const assignments = await employeeAssignmentService.getAssignments(employeeId, params);
      
      const isFirstPage = !params.page || params.page === 0;
      set({
        assignments: isFirstPage ? assignments : [...get().assignments, ...assignments],
        page: params.page || 0,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Không thể tải danh sách công việc', loading: false });
    }
  },

  // Accept booking detail
  acceptBookingDetail: async (detailId: string, employeeId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await employeeAssignmentService.acceptBookingDetail(detailId, employeeId);
      
      if (response.success && response.data) {
        // Remove from available bookings
        set(state => ({
          availableBookings: state.availableBookings.filter(b => b.detailId !== detailId),
          loading: false,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Không thể chấp nhận công việc', loading: false });
      throw error;
    }
  },

  // Cancel assignment
  cancelAssignment: async (assignmentId: string, employeeId: string, reason: string) => {
    try {
      set({ loading: true, error: null });
      await employeeAssignmentService.cancelAssignment(assignmentId, employeeId, reason);
      
      set(state => ({
        assignments: state.assignments.map(assignment =>
          assignment.assignmentId === assignmentId
            ? { ...assignment, status: 'CANCELLED' as ServiceAssignmentStatus }
            : assignment
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể hủy công việc', loading: false });
      throw error;
    }
  },

  // Check in
  checkIn: async (assignmentId: string, employeeId: string, imageFile?: any) => {
    try {
      set({ loading: true, error: null });
      await employeeAssignmentService.checkIn(assignmentId, employeeId, imageFile);
      
      set(state => ({
        assignments: state.assignments.map(assignment =>
          assignment.assignmentId === assignmentId
            ? { ...assignment, status: 'IN_PROGRESS' as ServiceAssignmentStatus }
            : assignment
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể check-in', loading: false });
      throw error;
    }
  },

  // Check out
  checkOut: async (assignmentId: string, employeeId: string, imageFile?: any) => {
    try {
      set({ loading: true, error: null });
      await employeeAssignmentService.checkOut(assignmentId, employeeId, imageFile);
      
      set(state => ({
        assignments: state.assignments.map(assignment =>
          assignment.assignmentId === assignmentId
            ? { ...assignment, status: 'COMPLETED' as ServiceAssignmentStatus }
            : assignment
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể check-out', loading: false });
      throw error;
    }
  },

  // Fetch available bookings
  fetchAvailableBookings: async (employeeId: string, params = {}) => {
    try {
      set({ loadingBookings: true, error: null });
      const response = await employeeAssignmentService.getAvailableBookings(employeeId, params);
      
      if (response.success && response.data) {
        const isFirstPage = !params.page || params.page === 0;
        set({
          availableBookings: isFirstPage ? response.data : [
            ...get().availableBookings,
            ...response.data,
          ],
          loadingBookings: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Không thể tải danh sách công việc khả dụng',
        loadingBookings: false,
      });
    }
  },

  // Fetch schedule
  fetchSchedule: async (employeeId: string, startDate: Date, endDate: Date) => {
    try {
      set({ loadingSchedule: true, error: null });
      const scheduleData = await employeeScheduleService.getEmployeeSchedule(employeeId, startDate, endDate);
      
      if (scheduleData) {
        set({
          schedule: scheduleData.timeSlots || [],
          loadingSchedule: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Không thể tải lịch làm việc',
        loadingSchedule: false,
      });
    }
  },

  // Fetch today schedule
  fetchTodaySchedule: async (employeeId: string) => {
    try {
      set({ loadingSchedule: true, error: null });
      const schedule = await employeeScheduleService.getTodaySchedule(employeeId);
      
      set({
        schedule: schedule || [],
        loadingSchedule: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Không thể tải lịch hôm nay',
        loadingSchedule: false,
      });
    }
  },

  // Set current assignment
  setCurrentAssignment: (assignment: EmployeeAssignment | null) => {
    set({ currentAssignment: assignment });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear assignments
  clearAssignments: () => {
    set({
      assignments: [],
      currentAssignment: null,
      availableBookings: [],
      schedule: [],
      page: 0,
      hasMore: true,
      error: null,
    });
  },
}));
