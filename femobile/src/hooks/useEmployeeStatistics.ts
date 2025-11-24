import { useState, useCallback } from 'react';
import { employeeService, type AssignmentStatisticsResponse } from '../services/employeeService';

export const useEmployeeStatistics = () => {
  const [statistics, setStatistics] = useState<AssignmentStatisticsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatistics = useCallback(
    async (
      employeeId: string,
      timeUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
      startDate?: string,
      endDate?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await employeeService.getAssignmentStatistics(
          employeeId,
          timeUnit,
          startDate,
          endDate,
        );
        setStatistics(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải thống kê';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    statistics,
    loading,
    error,
    getStatistics,
  };
};
