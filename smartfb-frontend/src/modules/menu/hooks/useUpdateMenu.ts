import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';
import type { UpdateMenuPayload } from '@modules/menu/types/menu.types';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success('Đã cập nhật món ăn thành công');
    },
    onError: (e: Error) => {
      error(e.message || 'Không thể cập nhật món ăn. Vui lòng thử lại.');
    },
  });
};
