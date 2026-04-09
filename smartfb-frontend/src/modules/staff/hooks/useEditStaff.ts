import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { UpdateStaffRequest } from '../types/staff.types';

export const useEditStaff = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStaffRequest }) => {
      await staffService.update(id, data);
      return { id, data };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.id) });
      success('Cập nhật thành công', 'Thông tin nhân viên đã được cập nhật');
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật', errorMessage);
    },
  });
};