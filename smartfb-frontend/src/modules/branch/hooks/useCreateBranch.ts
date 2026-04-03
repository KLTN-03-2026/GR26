import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });

      success(
        'Tạo chi nhánh thành công',
        `Chi nhánh ${response.data.name} đã được tạo thành công`
      );
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend.
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo chi nhánh', errorMessage);
    },
  });
};
