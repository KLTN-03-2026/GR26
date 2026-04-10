import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { tableService } from '@modules/table/services/tableService';
import type { TableArea, TableItem } from '@modules/table/types/table.types';
import { useZones } from '@modules/table/hooks/useZones';

/**
 * Hook lấy danh sách bàn của chi nhánh hiện tại.
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

/**
 * Hook lấy danh sách bàn và map thêm tên khu vực để hiển thị ở UI.
 */
export const useTableListWithZones = () => {
  const { data: tables, isLoading: tablesLoading, error: tablesError } = useTableList();
  const { data: zones, isLoading: zonesLoading } = useZones();

  const isLoading = tablesLoading || zonesLoading;

  // Merge zone name vào tables
  const tablesWithZoneNames = useMemo(() => {
    if (!tables || !zones) return [];

    const zoneMap = new Map(
      zones.map((zone: TableArea) => [zone.id, zone.name])
    );

    return tables.map((table: TableItem) => ({
      ...table,
      zoneName: zoneMap.get(table.zoneId) || 'Không xác định',
    }));
  }, [tables, zones]);

  return {
    data: tablesWithZoneNames,
    isLoading,
    error: tablesError,
  };
};
