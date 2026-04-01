import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook xử lý xóa chi nhánh
 * Gọi API DELETE /api/v1/branches/:id
 *
 * @example
 * const { mutate, isPending } = useDeleteBranch();
 * mutate(branchId, {
 *   onSuccess: () => console.log('Xóa thành công'),
 * });
 */
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return branchService.delete(id);
    },
    onSuccess: (response, branchId) => {
      // Invalidate để refetch danh sách
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      success(
        'Xóa chi nhánh thành công',
        'Chi nhánh đã được xóa khỏi hệ thống'
      );
    },
    onError: (err) => {
      console.error('Failed to delete branch:', err);
      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa chi nhánh', errorMessage);
    },
  });
};
