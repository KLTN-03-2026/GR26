import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import type { MenuAddonInfo, UpdateMenuAddonPayload } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface UpdateAddonParams {
  id: string;
  payload: UpdateMenuAddonPayload;
  currentAddon?: MenuAddonInfo;
}

/**
 * Hook cập nhật thông tin hoặc trạng thái addon/topping.
 *
 * @returns Mutation object để lưu thay đổi addon
 */
export const useUpdateAddon = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateAddonParams) => menuService.updateAddon(id, payload),
    onSuccess: (response, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.addons });

      const wasActive = variables.currentAddon?.isActive !== false;
      const isActive = response.data.isActive !== false;

      if (wasActive !== isActive) {
        success(
          isActive ? 'Kích hoạt topping thành công' : 'Vô hiệu hóa topping thành công',
          `Đã cập nhật trạng thái topping ${response.data.name}`
        );
        return;
      }

      success('Cập nhật topping thành công', `Đã lưu thay đổi cho topping ${response.data.name}`);
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật topping', errorMessage);
    },
  });
};
