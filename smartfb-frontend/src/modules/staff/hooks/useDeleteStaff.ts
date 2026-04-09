import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { useToast } from '@shared/hooks/useToast';

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const deleteReason = reason || 'Xóa nhân viên từ giao diện quản lý';
      await staffService.deactivate(id, deleteReason);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      success('Vô hiệu hoá nhân viên thành công');
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      const errorMessage = err.response?.data?.error?.message || err.message || 'Vui lòng thử lại sau';
      error('Không thể vô hiệu hoá nhân viên', errorMessage);
    },
  });
};