import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';

interface AssignStaffRolesParams {
  staffId: string;
  roleIds: string[];
}

/**
 * Hook gán lại tập role cho nhân viên.
 * Backend dùng cơ chế replace-all nên FE luôn gửi toàn bộ `roleIds` cuối cùng.
 */
export const useAssignStaffRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, roleIds }: AssignStaffRolesParams) => {
      await staffService.assignRoles(staffId, roleIds);
      return { staffId, roleIds };
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.staffId) });
    },
  });
};
