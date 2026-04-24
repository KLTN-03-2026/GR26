import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';

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
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      success("Đã xóa món ăn thành công");
    },
    onError: (e: Error) => {
      error(e.message || 'Không thể xóa món ăn. Vui lòng thử lại.');
    },
  });
};
