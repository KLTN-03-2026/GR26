import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { tableService } from '../services/tableService';
import type { TableItem } from '../types/table.types'; 

export const useTableDetail = (tableId: string) => {
  return useQuery<TableItem, Error>({
    queryKey: queryKeys.tables.detail(tableId),
    queryFn: async () => {
      // service.getById đã trả về TableItem, không cần check success
      const table = await tableService.getById(tableId);
      return table;
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(tableId),
  });
};