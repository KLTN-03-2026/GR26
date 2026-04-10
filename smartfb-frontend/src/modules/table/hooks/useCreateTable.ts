import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '@modules/table/services/tableService';
import type { CreateTablePayload, TableItem } from '@modules/table/types/table.types';

/**
 * Hook tạo mới một bàn và đồng bộ lại cache liên quan.
 */
export const useCreateTable = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTablePayload) => {
      const newTable = await tableService.create(data);
      return newTable;
    },
    onSuccess: (data: TableItem) => {
      // Invalidate tất cả queries liên quan
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.zones });
      success('Tạo bàn thành công', `Bàn ${data.name} đã được tạo`);
    },
    onError: (err) => {
      console.error('Create table failed', err);
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Tạo bàn thất bại', message);
    },
  });
};
