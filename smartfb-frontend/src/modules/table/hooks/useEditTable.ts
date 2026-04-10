import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '../services/tableService';
import type { UpdateTablePayload, TableDetail } from '../types/table.types';

export const useEditTable = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTablePayload }) => {
      const response = await tableService.update(id, payload);
      if (!response.success) {
        throw new Error('Không thể cập nhật bàn');
      }
      return response.data;
    },
    onSuccess: (table: TableDetail) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail(table.id) });
      success('Cập nhật bàn thành công', `Bàn ${table.name} đã được cập nhật`);
    },
    onError: (err) => {
      console.error('Update table failed', err);
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Cập nhật bàn thất bại', message);
    },
  });
};