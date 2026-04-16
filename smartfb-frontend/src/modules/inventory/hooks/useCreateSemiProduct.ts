import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

export interface CreateSemiProductPayload {
  name: string;
  unit: string;
  basePrice?: number;
}

/**
 * Hook tạo mới bán thành phẩm trong catalog kho.
 * Gọi POST /menu/items với type=SUB_ASSEMBLY.
 */
export const useCreateSemiProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateSemiProductPayload) =>
      menuService.create({
        name: payload.name.trim(),
        category: '',
        price: payload.basePrice ?? 0,
        unit: payload.unit.trim(),
        type: 'SUB_ASSEMBLY',
        isSyncDelivery: false,
      }),
    onSuccess: (response) => {
      // Đồng bộ lại catalog bán thành phẩm để tab kho có thể dùng ngay item vừa tạo.
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semiProducts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success(
        'Tạo bán thành phẩm thành công',
        `Đã thêm "${response.data.name}" vào danh mục bán thành phẩm.`,
      );
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const msg = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo bán thành phẩm', msg);
    },
  });
};
