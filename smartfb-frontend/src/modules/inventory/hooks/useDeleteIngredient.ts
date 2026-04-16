import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface DeleteIngredientParams {
  id: string;
  name: string;
}

/**
 * Hook xóa mềm nguyên liệu khỏi danh mục kho.
 * Dùng chung API `DELETE /menu/items/{id}` nhưng chuẩn hóa toast và invalidate theo ngữ cảnh inventory.
 */
export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();
  const { error, success } = useToast();

  return useMutation({
    mutationFn: ({ id }: DeleteIngredientParams) => menuService.delete(id),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.ingredients.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.ingredients });

      success('Xóa nguyên liệu thành công', `Đã xóa "${variables.name}" khỏi danh mục kho.`);
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa nguyên liệu', errorMessage);
    },
  });
};
