import { useMutation } from '@tanstack/react-query';
import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useToast } from '@shared/hooks/useToast';
import { isAxiosError } from 'axios';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook đổi chi nhánh làm việc để backend cấp lại JWT chứa `branchId`.
 */
export const useSelectBranch = () => {
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const currentUser = useAuthStore((state) => state.user);
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (branchId: string) => authService.selectBranch(branchId),
    onSuccess: (response) => {
      setAuthSession(response.data, {
        email: currentUser?.email,
        fullName: currentUser?.fullName,
        phone: currentUser?.phone,
      });

      success('Đổi chi nhánh thành công', 'Phiên làm việc đã chuyển sang chi nhánh mới.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Không thể đổi chi nhánh làm việc';
      error('Đổi chi nhánh thất bại', errorMessage);
    },
  });
};
