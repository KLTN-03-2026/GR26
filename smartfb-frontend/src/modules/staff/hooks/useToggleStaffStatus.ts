import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { useToast } from '@shared/hooks/useToast';

export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      if (status === 'INACTIVE') {
        await staffService.deactivate(id, 'Vô hiệu hoá nhân viên từ giao diện quản lý');
      } else {
        throw new Error('Tính năng kích hoạt lại nhân viên hiện chưa được hỗ trợ');
      }
      return { id, status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.id) });
      success('Vô hiệu hoá nhân viên thành công', 'Nhân viên đã bị vô hiệu hoá');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Vui lòng thử lại sau';
      error('Không thể cập nhật trạng thái', errorMessage);
    },
  });
};