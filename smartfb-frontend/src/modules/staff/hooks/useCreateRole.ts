import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { roleService } from '@modules/staff/services/roleService';
import type { CreateRoleRequest } from '@modules/staff/types/role.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook tạo role mới trong tenant hiện tại.
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateRoleRequest) => roleService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      success('Tạo vai trò thành công', 'Vai trò mới đã sẵn sàng để cấu hình quyền');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo vai trò', errorMessage);
    },
  });
};
