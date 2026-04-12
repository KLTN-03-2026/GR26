import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '../services/tableService';

/**
 * Hook xóa một bàn khỏi hệ thống.
 * Thành công sẽ refresh cache danh sách bàn để sơ đồ và bảng quản lý đồng bộ ngay.
 */
export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await tableService.delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      success('Xóa bàn thành công', 'Bàn đã được xóa khỏi hệ thống');
    },
    onError: (err) => {
      console.error('Delete table failed', err);
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Xóa bàn thất bại', message);
    },
  });
};
