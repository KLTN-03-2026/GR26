import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface DeleteCategoryParams {
  id: string;
  name: string;
}

/**
 * Hook xóa danh mục thực đơn.
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id }: DeleteCategoryParams) => menuService.deleteCategory(id),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories });
      success('Xóa danh mục thành công', `Đã xóa danh mục ${variables.name}`);
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend.
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa danh mục', errorMessage);
    },
  });
};
