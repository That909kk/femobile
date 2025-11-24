import { useState, useCallback } from 'react';
import { employeeService, type Employee, type UpdateEmployeeRequest } from '../services/employeeService';

export const useEmployee = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEmployee = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getEmployeeById(employeeId);
      setEmployee(data);
      return data;
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải thông tin nhân viên';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmployee = useCallback(
    async (employeeId: string, updates: UpdateEmployeeRequest) => {
      setLoading(true);
      setError(null);
      try {
        const data = await employeeService.updateEmployee(employeeId, updates);
        setEmployee(data);
        return data;
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể cập nhật thông tin nhân viên';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const uploadAvatar = useCallback(async (employeeId: string, imageFile: File | Blob) => {
    setLoading(true);
    setError(null);
    try {
      const result = await employeeService.uploadAvatar(employeeId, imageFile);
      // Refresh employee data after avatar upload
      await getEmployee(employeeId);
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải lên ảnh đại diện';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getEmployee]);

  return {
    employee,
    loading,
    error,
    getEmployee,
    updateEmployee,
    uploadAvatar,
  };
};
