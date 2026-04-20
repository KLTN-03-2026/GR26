import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { roleService } from '@modules/staff/services/roleService';
import type { UpdateRolePermissionsRequest } from '@modules/staff/types/role.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface UpdateRolePermissionsVariables {
  id: string;
  payload: UpdateRolePermissionsRequest;
}

/**
 * Hook lưu ma trận quyền cho từng role.
 */
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateRolePermissionsVariables) =>
      roleService.updatePermissions(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      success('Lưu phân quyền thành công', 'Role đã được cập nhật theo ma trận quyền mới');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể lưu phân quyền', errorMessage);
    },
  });
};
