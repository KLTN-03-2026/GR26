import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import type { CreateMenuAddonPayload } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook tạo mới addon/topping.
 *
 * @returns Mutation object để thêm addon vào menu
 */
export const useCreateAddon = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateMenuAddonPayload) => menuService.createAddon(payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.addons });
      success('Tạo topping thành công', `Đã thêm topping ${response.data.name}`);
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo topping', errorMessage);
    },
  });
};
