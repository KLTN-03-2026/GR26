import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import type { MenuCategoryInfo, UpdateMenuCategoryPayload } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface UpdateCategoryParams {
  id: string;
  payload: UpdateMenuCategoryPayload;
  currentCategory?: MenuCategoryInfo;
}

/**
 * Hook cập nhật thông tin hoặc trạng thái danh mục.
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCategoryParams) => menuService.updateCategory(id, payload),
    onSuccess: (response, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories });

      const wasActive = variables.currentCategory?.isActive !== false;
      const isActive = response.data.isActive !== false;

      if (wasActive !== isActive) {
        success(
          isActive ? 'Kích hoạt danh mục thành công' : 'Vô hiệu hóa danh mục thành công',
          `Đã cập nhật trạng thái danh mục ${response.data.name}`
        );
        return;
      }

      success('Cập nhật danh mục thành công', `Đã lưu thay đổi cho danh mục ${response.data.name}`);
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend.
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật danh mục', errorMessage);
    },
  });
};
