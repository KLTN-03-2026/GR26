import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook toggle trạng thái bán hàng của món ăn
 * @returns Mutation object để toggle status
 */
export const useToggleMenu = () => {
  const queryClient = useQueryClient();
  const { success,error } = useToast();

  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      menuService.toggle(id, isAvailable),
    onSuccess: (data, variables) => {
      // Optimistic update cho menu item cụ thể
      queryClient.invalidateQueries({
        queryKey: queryKeys.menu.list({}),
      });

      const statusText = variables.isAvailable ? 'Đã bật bán' : 'Đã tạm ẩn';
      success(`${data.data.name} - ${statusText}`);
    },
    onError: (e: Error, variables) => {
      const statusText = variables.isAvailable ? 'bật bán' : 'tạm ẩn';
      error(`Không thể ${statusText} món ăn. Vui lòng thử lại.`);
    },
  });
};
