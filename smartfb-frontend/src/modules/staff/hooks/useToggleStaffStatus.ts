import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getStaffMutationErrorMessage } from '@modules/staff/utils/getStaffMutationErrorMessage';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { useToast } from '@shared/hooks/useToast';
import type { StaffStatus } from '../types/staff.types';

interface ToggleStaffStatusVariables {
  id: string;
  status: StaffStatus;
}

const getDefaultStatusReason = (status: StaffStatus): string => {
  return status === 'ACTIVE'
    ? 'Mở khóa nhân viên từ giao diện quản lý'
    : 'Khóa nhân viên từ giao diện quản lý';
};

/**
 * Hook đổi trạng thái nhân viên.
 * Dùng API khóa/mở khóa để nhân viên vẫn tồn tại trong hệ thống và có thể khôi phục.
 */
export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: ToggleStaffStatusVariables) => {
      await staffService.updateStatus(id, {
        status,
        reason: getDefaultStatusReason(status),
      });
      return { id, status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.id) });
      const isActive = variables.status === 'ACTIVE';
      success(
        isActive ? 'Mở khóa nhân viên thành công' : 'Khóa nhân viên thành công',
        isActive
          ? 'Nhân viên đã có thể đăng nhập và làm việc trở lại'
          : 'Nhân viên đã tạm thời bị khóa khỏi hệ thống'
      );
    },
    onError: (err: unknown) => {
      error('Không thể cập nhật trạng thái', getStaffMutationErrorMessage(err));
    },
  });
};
