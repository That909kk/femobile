import { create } from 'zustand';
import {
  BookingResponse,
  BookingRequest,
  BookingValidationRequest,
  BookingValidationResponse,
  BookingStatus,
} from '../types';
import { bookingService } from '../services';

interface BookingState {
  bookings: BookingResponse[];
  currentBooking: BookingResponse | null;
  loading: boolean;
  validating: boolean;
  error: string | null;
  validationResult: BookingValidationResponse | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface BookingActions {
  fetchBookings: (customerId: string, params?: {
    page?: number;
    size?: number;
    status?: string;
    sort?: string;
  }) => Promise<void>;
  fetchBookingById: (bookingId: string) => Promise<void>;
  validateBooking: (request: BookingValidationRequest) => Promise<BookingValidationResponse>;
  createBooking: (request: BookingRequest) => Promise<BookingResponse>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<void>;
  updateBooking: (bookingId: string, updates: Partial<BookingRequest>) => Promise<void>;
  setCurrentBooking: (booking: BookingResponse | null) => void;
  clearValidation: () => void;
  clearError: () => void;
  clearBookings: () => void;
}

export const useBookingStore = create<BookingState & BookingActions>((set, get) => ({
  // Initial state
  bookings: [],
  currentBooking: null,
  loading: false,
  validating: false,
  error: null,
  validationResult: null,
  page: 0,
  totalPages: 0,
  hasMore: true,

  // Fetch bookings
  fetchBookings: async (customerId: string, params = {}) => {
    try {
      set({ loading: true, error: null });
      const response = await bookingService.getCustomerBookings(customerId, params);
      
      const isFirstPage = !params.page || params.page === 0;
      
      set({
        bookings: isFirstPage ? response.content : [...get().bookings, ...response.content],
        page: response.number,
        totalPages: response.totalPages,
        hasMore: response.number < response.totalPages - 1,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Không thể tải danh sách đặt lịch', loading: false });
    }
  },

  // Fetch booking by ID
  fetchBookingById: async (bookingId: string) => {
    try {
      set({ loading: true, error: null });
      const booking = await bookingService.getBookingById(bookingId);
      
      set({
        currentBooking: booking,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Không thể tải thông tin đặt lịch', loading: false });
    }
  },

  // Validate booking
  validateBooking: async (request: BookingValidationRequest) => {
    try {
      set({ validating: true, error: null });
      const validationResult = await bookingService.validateBooking(request);
      
      set({
        validationResult,
        validating: false,
      });
      return validationResult;
    } catch (error: any) {
      set({ 
        error: error.message || 'Không thể xác thực đặt lịch',
        validating: false,
      });
      throw error;
    }
  },

  // Create booking
  createBooking: async (request: BookingRequest) => {
    try {
      set({ loading: true, error: null });
      const booking = await bookingService.createBooking(request);
      
      set(state => ({
        bookings: [booking, ...state.bookings],
        currentBooking: booking,
        loading: false,
      }));
      
      return booking;
    } catch (error: any) {
      set({ error: error.message || 'Không thể tạo đặt lịch', loading: false });
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId: string, reason?: string) => {
    try {
      set({ loading: true, error: null });
      await bookingService.cancelBooking(bookingId, reason);
      
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.bookingId === bookingId
            ? { ...booking, status: 'CANCELLED' as BookingStatus }
            : booking
        ),
        currentBooking: state.currentBooking?.bookingId === bookingId
          ? { ...state.currentBooking, status: 'CANCELLED' as BookingStatus }
          : state.currentBooking,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể hủy đặt lịch', loading: false });
      throw error;
    }
  },

  // Update booking
  updateBooking: async (bookingId: string, updates: Partial<BookingRequest>) => {
    try {
      set({ loading: true, error: null });
      const updatedBooking = await bookingService.updateBooking(bookingId, updates);
      
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.bookingId === bookingId ? updatedBooking : booking
        ),
        currentBooking: state.currentBooking?.bookingId === bookingId
          ? updatedBooking
          : state.currentBooking,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Không thể cập nhật đặt lịch', loading: false });
      throw error;
    }
  },

  // Set current booking
  setCurrentBooking: (booking: BookingResponse | null) => {
    set({ currentBooking: booking });
  },

  // Clear validation
  clearValidation: () => {
    set({ validationResult: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear bookings
  clearBookings: () => {
    set({
      bookings: [],
      currentBooking: null,
      page: 0,
      totalPages: 0,
      hasMore: true,
      validationResult: null,
      error: null,
    });
  },
}));
