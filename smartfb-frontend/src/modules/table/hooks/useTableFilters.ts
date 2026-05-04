import { useCallback, useMemo, useState } from 'react';
import type { PaginationState, TableItem, TableFilters } from '../types/table.types';

const PAGE_SIZE = 12;

/**
 * Hook quản lý filter và phân trang cho danh sách bàn trong một chi nhánh.
 */
export const useTableFilters = <T extends TableItem>(tables: T[]) => {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    state: 'all',
    area: 'all',
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    // UI page bắt đầu từ 1 để đồng nhất với phân trang hiển thị.
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  const filteredTables = useMemo(() => {
    const result = tables.filter(table => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!table.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.area !== 'all' && table.zoneId !== filters.area) {
        return false;
      }

      if (filters.state === 'active') {
        return table.status === 'active';
      }

      if (filters.state === 'occupied') {
        return table.status === 'active' && (table.usageStatus === 'occupied' || table.usageStatus === 'unpaid');
      }

      if (filters.state === 'inactive') {
        return table.status === 'inactive';
      }

      return true;
    });

    return result;
  }, [tables, filters]);

  const { paginatedTables, totalItems } = useMemo(() => {
    const total = filteredTables.length;
    const start = (paginationState.page - 1) * paginationState.pageSize;
    const end = start + paginationState.pageSize;

    return {
      paginatedTables: filteredTables.slice(start, end),
      totalItems: total,
    };
  }, [filteredTables, paginationState.page, paginationState.pageSize]);

  const pagination = useMemo<PaginationState>(() => ({
    ...paginationState,
    total: totalItems,
  }), [paginationState, totalItems]);

  const updateFilter = useCallback((key: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      state: 'all',
      area: 'all',
    });
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setPaginationState(prev => ({ ...prev, page }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.state !== 'all' ||
      filters.area !== 'all'
    );
  }, [filters]);

  return {
    filters,
    pagination,
    tables: paginatedTables,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages: Math.ceil(pagination.total / pagination.pageSize),
  };
};
