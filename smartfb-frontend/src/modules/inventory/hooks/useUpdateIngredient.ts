import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

export interface UpdateIngredientPayload {
  id: string;
  name: string;
  unit: string;
  basePrice?: number;
  category?: string;
  isActive?: boolean;
  isSyncDelivery?: boolean;
}

/**
 * Hook cập nhật thông tin nguyên liệu trong danh mục kho.
 * Dùng chung API `PUT /menu/items/{id}` nhưng chuẩn hóa invalidate và toast theo ngữ cảnh inventory.
 */
export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();
  const { error, success } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateIngredientPayload) =>
      menuService.update(payload.id, {
        name: payload.name.trim(),
        category: payload.category ?? '',
        price: payload.basePrice ?? 0,
        unit: payload.unit.trim(),
        isActive: payload.isActive ?? true,
        isSyncDelivery: payload.isSyncDelivery ?? false,
      }),
    onSuccess: (response, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.ingredients.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.ingredients });

      success(
        'Cập nhật nguyên liệu thành công',
        `Đã lưu thay đổi cho "${response.data.name}".`,
      );
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật nguyên liệu', errorMessage);
    },
  });
};
