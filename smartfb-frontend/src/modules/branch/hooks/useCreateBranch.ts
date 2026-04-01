import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { branchService } from '../services/branchService';
import type { CreateBranchPayload } from '../types/branch.types';

/**
 * Hook xử lý tạo chi nhánh mới
 * Gọi API POST /api/v1/branches
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateBranchPayload) => {
      return branchService.create(payload);
    },
    onSuccess: (response) => {
      // Invalidate queries để refetch danh sách chi nhánh
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });

      success(
        'Tạo chi nhánh thành công',
        `Chi nhánh ${response.data.name} đã được tạo thành công`
      );
    },
    onError: (err) => {
      console.error('Failed to create branch:', err);
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo chi nhánh', errorMessage);
    },
  });
};
