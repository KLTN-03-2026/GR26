import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { tableService } from '@modules/table/services/tableService';
import type { TableArea } from '@modules/table/types/table.types';

/**
 * Hook lấy danh sách khu vực của chi nhánh đang thao tác.
 */
export const useZones = () => {
  return useQuery<TableArea[]>({
    queryKey: queryKeys.tables.zones,
    queryFn: async () => {
      const zones = await tableService.getZones();
      return zones;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
  });
};
