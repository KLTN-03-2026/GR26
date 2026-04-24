import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { EditStaffFormData } from '../types/staff.types';

/**
 * Hook xử lý cập nhật thông tin nhân viên
 */
export const useEditStaff = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditStaffFormData }) => {
      return staffService.update(id, data);
    },
    onSuccess: (response, variables) => {
      // Invalidate queries để refetch danh sách và chi tiết
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['staff', 'detail', variables.id] });

      success(
        'Cập nhật thành công',
        `Thông tin nhân viên ${response.data.firstName} ${response.data.lastName} đã được cập nhật`
      );
    },
    onError: (err) => {
      console.error('Failed to update staff:', err);
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật', errorMessage);
    },
  });
};