import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '../services/tableService';
import type { CreateTablePayload, TableDetail } from '../types/table.types';

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTablePayload) => {
      const response = await tableService.create(data);
      if (!response.success) {
        throw new Error('Không thể tạo bàn');
      }
      return response.data;
    },
    onSuccess: (data: TableDetail) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      success('Tạo bàn thành công', `Bàn ${data.name} đã được tạo`);
    },
    onError: (err) => {
      console.error('Create table failed', err);
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Tạo bàn thất bại', message);
    },
  });
};