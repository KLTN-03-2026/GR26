import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

export interface CreateIngredientPayload {
  name: string;
  unit: string;
  basePrice?: number;
}

/**
 * Hook tạo mới nguyên liệu trong danh mục kho.
 * Gọi POST /menu/items với type=INGREDIENT.
 * Sau khi tạo thành công, invalidate cache ingredient options để form nhập kho tự cập nhật.
 */
export const useCreateIngredient = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateIngredientPayload) =>
      menuService.create({
        name: payload.name.trim(),
        // INGREDIENT không thuộc danh mục menu — dùng NO_MENU_CATEGORY_VALUE
        category: '',
        price: payload.basePrice ?? 0,
        unit: payload.unit.trim(),
        type: 'INGREDIENT',
        isSyncDelivery: false,
      }),
    onSuccess: (response) => {
      // Invalidate ingredient options để dropdown nhập kho hiện nguyên liệu mới
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.ingredients.all });
      // Invalidate menu all phòng khi user mở menu management page sau đó
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success(
        'Tạo nguyên liệu thành công',
        `Đã thêm "${response.data.name}" vào danh mục kho.`,
      );
    },
    onError: (err) => {
      // Ưu tiên để axios interceptor hiển thị lỗi nghiệp vụ từ backend (vd: trùng tên)
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo nguyên liệu', msg);
    },
  });
};
