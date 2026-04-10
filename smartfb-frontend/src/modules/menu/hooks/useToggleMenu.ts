import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { MenuItem } from '@modules/menu/types/menu.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook toggle trạng thái bán hàng của món ăn
 * @returns Mutation object để toggle status
 */
export const useToggleMenu = () => {
  const queryClient = useQueryClient();
  const { success,error } = useToast();

  return useMutation({
    mutationFn: ({ menu, isAvailable }: { menu: MenuItem; isAvailable: boolean }) =>
      menuService.toggle(menu, isAvailable),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });

      const statusText = variables.isAvailable ? 'Đã bật bán' : 'Đã tạm ẩn';
      success(`${data.data.name} - ${statusText}`);
    },
    onError: (err, variables) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const statusText = variables.isAvailable ? 'bật bán' : 'tạm ẩn';
      error(`Không thể ${statusText} món ăn`, err instanceof Error ? err.message : 'Vui lòng thử lại sau');
    },
  });
};
