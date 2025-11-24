import { useState, useCallback } from 'react';
import {
  employeeAssignmentService,
  type EmployeeAssignment,
  type AssignmentStatus,
  type AvailableBookingDetail,
} from '../services/employeeAssignmentService';

export const useEmployeeAssignments = () => {
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [availableBookings, setAvailableBookings] = useState<AvailableBookingDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssignments = useCallback(
    async (
      employeeId: string,
      params?: { status?: AssignmentStatus; page?: number; size?: number; sort?: string },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await employeeAssignmentService.getAssignments(employeeId, params);
        setAssignments(data);
        return data;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải danh sách công việc';
        setError(errorMessage);
        setAssignments([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getAvailableBookings = useCallback(
    async (employeeId: string, params?: { page?: number; size?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await employeeAssignmentService.getAvailableBookings(employeeId, params);
        setAvailableBookings(response.data || []);
        return response.data || [];
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải danh sách booking có sẵn';
        setError(errorMessage);
        setAvailableBookings([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const acceptBooking = useCallback(async (detailId: string, employeeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeeAssignmentService.acceptBookingDetail(detailId, employeeId);
      // Refresh available bookings after accepting
      await getAvailableBookings(employeeId);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể nhận công việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAvailableBookings]);

  const cancelAssignment = useCallback(
    async (assignmentId: string, employeeId: string, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        await employeeAssignmentService.cancelAssignment(assignmentId, employeeId, reason);
        // Refresh assignments after canceling
        await getAssignments(employeeId);
        return true;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể hủy công việc';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAssignments],
  );

  const checkIn = useCallback(
    async (assignmentId: string, employeeId: string, images?: File[]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await employeeAssignmentService.checkIn(assignmentId, employeeId, images);
        // Refresh assignments after check-in
        await getAssignments(employeeId);
        return response;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể check-in';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAssignments],
  );

  const checkOut = useCallback(
    async (assignmentId: string, employeeId: string, images?: File[]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await employeeAssignmentService.checkOut(assignmentId, employeeId, images);
        // Refresh assignments after check-out
        await getAssignments(employeeId);
        return response;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể check-out';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAssignments],
  );

  return {
    assignments,
    availableBookings,
    loading,
    error,
    getAssignments,
    getAvailableBookings,
    acceptBooking,
    cancelAssignment,
    checkIn,
    checkOut,
  };
};
