import { useState, useCallback } from 'react';
import {
  employeeScheduleService,
  type EmployeeScheduleData,
} from '../services/employeeScheduleService';

export const useEmployeeSchedule = () => {
  const [schedule, setSchedule] = useState<EmployeeScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSchedule = useCallback(
    async (employeeId: string, startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);
      try {
        const data = await employeeScheduleService.getEmployeeSchedule(
          employeeId,
          startDate,
          endDate,
        );
        setSchedule(data);
        return data;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải lịch làm việc';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    schedule,
    loading,
    error,
    getSchedule,
  };
};
