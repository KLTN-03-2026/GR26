import { useMemo, useState, useCallback } from 'react';
import type { TableDetail } from '../data/tableDetails';
import type { TableFilters, PaginationState } from '../types/table.types';

const PAGE_SIZE = 12;

export const useTableFilters = (tables: TableDetail[]) => {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    status: 'all',
    area: 'all',
    usageStatus: 'all',
    branch: 'all',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  const areas = useMemo(() => {
    const setAreas = new Set(tables.map(table => table.areaName));
    return Array.from(setAreas);
  }, [tables]);

  const branches = useMemo(() => {
    const setBranches = new Set(tables.map(table => table.branchName));
    return Array.from(setBranches);
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!table.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.status !== 'all' && table.status !== filters.status) {
        return false;
      }

      if (filters.area !== 'all' && table.areaName !== filters.area) {
        return false;
      }

      if (filters.usageStatus !== 'all' && table.usageStatus !== filters.usageStatus) {
        return false;
      }

      if (filters.branch !== 'all' && table.branchName !== filters.branch) {
        return false;
      }

      return true;
    });
  }, [tables, filters]);

  const { paginatedTables, totalItems } = useMemo(() => {
    const total = filteredTables.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    return {
      paginatedTables: filteredTables.slice(start, end),
      totalItems: total,
    };
  }, [filteredTables, pagination.page, pagination.pageSize]);

  useMemo(() => {
    if (pagination.total !== totalItems) {
      setPagination(prev => ({ ...prev, total: totalItems }));
    }
  }, [totalItems, pagination.total]);

  const updateFilter = useCallback((key: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', area: 'all', usageStatus: 'all', branch: 'all' });
    setPagination(prev => ({ ...prev, page: 1, total: tables.length }));
  }, [tables.length]);

  const updatePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.area !== 'all' ||
      filters.usageStatus !== 'all' ||
      filters.branch !== 'all'
    );
  }, [filters]);

  return {
    filters,
    pagination,
    areas,
    branches,
    tables: paginatedTables,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages: Math.ceil(pagination.total / pagination.pageSize),
  };
};