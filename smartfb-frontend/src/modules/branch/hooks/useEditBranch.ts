import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { branchService } from '../services/branchService';
import type { UpdateBranchPayload } from '../types/branch.types';

/**
 * Hook xử lý cập nhật thông tin chi nhánh
 * Gọi API PUT /api/v1/branches/:id
 */
export const useEditBranch = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateBranchPayload }) => {
      return branchService.update(id, payload);
    },
    onSuccess: (response, variables) => {
      // Invalidate queries để refetch danh sách và chi tiết
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.detail(variables.id) });

      success(
        'Cập nhật thành công',
        `Thông tin chi nhánh ${response.data.name} đã được cập nhật`
      );
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật', errorMessage);
    },
  });
};
