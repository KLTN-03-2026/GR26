import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';

interface AssignUserToBranchParams {
  branchId: string;
  userId: string;
}

/**
 * Hook gán user vào một chi nhánh cụ thể.
 * Backend lưu mapping vào `branch_users` để staff có thể chọn và làm việc tại chi nhánh đó.
 */
export const useAssignUserToBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, userId }: AssignUserToBranchParams) => {
      await branchService.assignUserToBranch(branchId, { userId });
      return { branchId, userId };
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.userId) });
    },
  });
};
