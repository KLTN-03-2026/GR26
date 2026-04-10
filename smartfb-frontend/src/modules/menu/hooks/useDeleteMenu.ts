import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook xóa món ăn
 * @returns Mutation object để xóa món ăn
 */
export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  const { success,error } = useToast();

  return useMutation({
    mutationFn: (id: string) => menuService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success('Đã xóa món ăn thành công');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa món ăn', errorMessage);
    },
  });
};
