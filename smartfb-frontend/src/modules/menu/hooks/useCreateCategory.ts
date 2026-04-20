import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import type { CreateMenuCategoryPayload } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook tạo mới danh mục thực đơn.
 *
 * @returns Mutation object để tạo danh mục mới
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateMenuCategoryPayload) => menuService.createCategory(payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories });
      success('Tạo danh mục thành công', `Đã thêm danh mục ${response.data.name}`);
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend.
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo danh mục', errorMessage);
    },
  });
};
