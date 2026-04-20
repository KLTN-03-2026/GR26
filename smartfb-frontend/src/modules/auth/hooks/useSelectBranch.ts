import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useToast } from '@shared/hooks/useToast';
import { isAxiosError } from 'axios';
import type { ApiResponse } from '@shared/types/api.types';
import { queryKeys } from '@shared/constants/queryKeys';

interface UseSelectBranchOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Hook đổi chi nhánh làm việc để backend cấp lại JWT chứa `branchId`.
 *
 * @param options - Cấu hình bật/tắt toast theo ngữ cảnh sử dụng
 */
export const useSelectBranch = (options: UseSelectBranchOptions = {}) => {
  const queryClient = useQueryClient();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const currentUser = useAuthStore((state) => state.user);
  const { success, error } = useToast();
  const { showSuccessToast = true, showErrorToast = true } = options;

  return useMutation({
    mutationFn: (branchId: string) => authService.selectBranch(branchId),
    onSuccess: (response) => {
      setAuthSession(response.data, {
        email: currentUser?.email,
        fullName: currentUser?.fullName,
        phone: currentUser?.phone,
      });

      // Sau khi branch context đổi, cần refresh các query phụ thuộc JWT branch hiện tại.
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.shifts.templates.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });

      if (showSuccessToast) {
        success('Đổi chi nhánh thành công', 'Phiên làm việc đã chuyển sang chi nhánh mới.');
      }
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      if (!showErrorToast) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Không thể đổi chi nhánh làm việc';
      error('Đổi chi nhánh thất bại', errorMessage);
    },
  });
};
