import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { CreateStaffFormData } from '../types/staff.types';

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: async (data: CreateStaffFormData) => {
      const response = await staffService.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo nhân viên', errorMessage);
    },
  });
};