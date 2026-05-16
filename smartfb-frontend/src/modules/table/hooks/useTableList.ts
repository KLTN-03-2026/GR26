import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { tableService } from '@modules/table/services/tableService';
import type { TableItem } from '@modules/table/types/table.types';

/**
 * Hook lấy danh sách thẻ của chi nhánh hiện tại.
 */
export const useTableList = () => {
  return useQuery<TableItem[]>({
    queryKey: queryKeys.tables.list(),
    queryFn: async () => {
      const tables = await tableService.getList();
      return tables;
    },
    staleTime: 60 * 1000, // 1 phút
    gcTime: 5 * 60 * 1000, // 5 phút
    retry: 2,
    retryDelay: 1000,
  });
};
