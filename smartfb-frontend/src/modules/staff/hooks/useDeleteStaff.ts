import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getStaffMutationErrorMessage } from '@modules/staff/utils/getStaffMutationErrorMessage';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook vô hiệu hóa nhân viên từ màn quản lý.
 * Backend hiện dùng API deactivate nên hook này vừa cập nhật dữ liệu vừa hiển thị toast kết quả.
 */
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const deleteReason = reason || 'Xóa nhân viên từ giao diện quản lý';
      await staffService.deactivate(id, deleteReason);
      return id;
    },
    onSuccess: (deletedStaffId) => {
      queryClient.removeQueries({ queryKey: queryKeys.staff.detail(deletedStaffId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists });
      success('Vô hiệu hoá nhân viên thành công');
    },
    onError: (err: unknown) => {
      error('Không thể vô hiệu hoá nhân viên', getStaffMutationErrorMessage(err));
    },
  });
};
