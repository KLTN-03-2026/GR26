import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { CreateMenuPayload } from '@modules/menu/types/menu.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook tạo mới món ăn
 * @returns Mutation object để tạo món ăn mới
 */
export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => menuService.create(payload),
    onSuccess: (response) => {
      // Invalidate để refetch danh sách
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success('Tạo món ăn thành công', `Đã thêm món ${response.data.name} vào thực đơn`);
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend.
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo món ăn', errorMessage);
    },
  });
};
