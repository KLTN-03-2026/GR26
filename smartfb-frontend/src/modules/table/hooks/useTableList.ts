import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { tableService } from '../services/tableService';
import { useZones } from './useZones';
import type { TableItem } from '../types/table.types';

export const useTableList = () => {
  // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
  console.log('[DEBUG] useTableList hook called');
  return useQuery<TableItem[]>({
    queryKey: queryKeys.tables.list(),
    queryFn: async () => {
      // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
      console.log('[DEBUG] useTableList queryFn executed');
      const tables = await tableService.getList();
      return tables;
    },
    staleTime: 60 * 1000, // 1 phút
    gcTime: 5 * 60 * 1000, // 5 phút
    retry: 2,
    retryDelay: 1000,
  });
};

// Thêm hook riêng để lấy danh sách bàn cùng với tên zone
export const useTableListWithZones = () => {
  const { data: tables, isLoading: tablesLoading, error: tablesError } = useTableList();
  const { data: zones, isLoading: zonesLoading } = useZones();

  const isLoading = tablesLoading || zonesLoading;

  // Merge zone name vào tables
  const tablesWithZoneNames = useMemo(() => {
    if (!tables || !zones) return [];

    // Fix lỗi type: thêm type annotation cho zone
    const zoneMap = new Map(zones.map((zone: { id: string; name: string }) => [zone.id, zone.name]));

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