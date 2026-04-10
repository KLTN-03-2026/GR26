import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { tableService } from '../services/tableService';
import type { TableDetail } from '../types/table.types';

export const useTableDetail = (tableId: string) => {
  return useQuery<TableDetail, Error>({
    queryKey: queryKeys.tables.detail(tableId),
    queryFn: async () => {
      const response = await tableService.getById(tableId);
      if (!response.success) {
        throw new Error('Không thể lấy chi tiết bàn');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(tableId),
  });
};