import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { branchService } from '../services/branchService';

interface DisableBranchParams {
  id: string;
  name: string;
}

/**
 * Hook vô hiệu hoá chi nhánh.
 * Backend soft-delete chi nhánh bằng cách chuyển trạng thái sang INACTIVE và hủy phân công nhân viên.
 */
export const useDisableBranch = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id }: DisableBranchParams) => {
      await branchService.disable(id);
    },
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches.detail(variables.id) });

      success(
        'Vô hiệu hoá chi nhánh thành công',
        `Chi nhánh ${variables.name} đã ngừng hoạt động và nhân viên được hủy phân công khỏi chi nhánh này.`,
      );
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend.
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể vô hiệu hoá chi nhánh', errorMessage);
    },
  });
};
