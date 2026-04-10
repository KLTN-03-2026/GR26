import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '@modules/table/services/tableService';

/**
 * Hook xóa khu vực bàn khỏi chi nhánh hiện tại.
 */
export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await tableService.deleteZone(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.zones });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      success('Xóa khu vực thành công', 'Khu vực đã được xóa khỏi hệ thống');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Xóa khu vực thất bại', message);
    },
  });
};
