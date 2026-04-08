import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface DeleteAddonParams {
  id: string;
  name: string;
}

/**
 * Hook xóa addon/topping.
 *
 * @returns Mutation object để xóa mềm addon
 */
export const useDeleteAddon = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id }: DeleteAddonParams) => menuService.deleteAddon(id),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.addons });
      success('Xóa topping thành công', `Đã xóa topping ${variables.name}`);
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa topping', errorMessage);
    },
  });
};
