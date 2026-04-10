import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { CreateStaffRequest } from '../types/staff.types';

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data: CreateStaffRequest) => {
      const response = await staffService.create(data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      success('Thêm nhân viên thành công', `Nhân viên ${variables.fullName} đã được thêm.`);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Vui lòng thử lại sau';
      error('Không thể tạo nhân viên', errorMessage);
    },
  });
};