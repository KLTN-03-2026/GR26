import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook xử lý khóa/mở khóa nhân viên
 * Đáp ứng PB08 AC5: Khóa/mở khóa nhân viên
 */
export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      return staffService.updateStatus(id, status);
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['staff', 'detail', variables.id] });
      
      const statusText = variables.status === 'active' ? 'mở khóa' : 'khóa';
      success('Cập nhật trạng thái thành công', `Đã ${statusText} nhân viên`);
    },
    onError: (err) => {
      console.error('Failed to toggle staff status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật trạng thái', errorMessage);
    },
  });
};