import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { CreateMenuPayload } from '@modules/menu/types/menu.types';

/**
 * Hook tạo mới món ăn
 * @returns Mutation object để tạo món ăn mới
 */
export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => menuService.create(payload),
    onSuccess: () => {
      // Invalidate để refetch danh sách
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success("Đã tạo món ăn mới thành công ");
    },
    onError: (e: Error) => {
      error(e.message || 'Không thể tạo món ăn. Vui lòng thử lại.');
    },
  });
};
