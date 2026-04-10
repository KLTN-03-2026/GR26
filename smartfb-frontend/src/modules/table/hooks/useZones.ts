import { useQuery } from '@tanstack/react-query';
import { tableService } from '../services/tableService';
import type { TableArea } from '../types/table.types';

export const useZones = () => {
  return useQuery<TableArea[]>({
    queryKey: ['tables', 'zones'],
    queryFn: async () => {
      const zones = await tableService.getZones();
      return zones;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
  });
};