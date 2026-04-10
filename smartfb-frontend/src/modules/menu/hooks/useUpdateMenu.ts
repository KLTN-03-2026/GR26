import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { UpdateMenuPayload } from '@modules/menu/types/menu.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook cập nhật món ăn
 * @returns Mutation object để cập nhật món ăn
 */
export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  const { success,error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuPayload }) =>
      menuService.update(id, payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success('Cập nhật món ăn thành công', `Đã lưu thay đổi cho món ${response.data.name}`);
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật món ăn', errorMessage);
    },
  });
};
