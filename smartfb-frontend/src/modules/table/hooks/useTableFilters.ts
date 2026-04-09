import { useMemo, useState, useCallback } from 'react';
import type { TableItem, TableFilters, PaginationState } from '../types/table.types';

const PAGE_SIZE = 12;

export const useTableFilters = (tables: TableItem[]) => {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    status: 'all',
    area: 'all',      // lọc theo zoneId
    usageStatus: 'all',
    branch: 'all',    // lọc theo branchId
  });

  const [pagination, setPagination] = useState<PaginationState>({
    // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
    page: 1,  // UI page phải bắt đầu từ 1 để logic slice hoạt động đúng
    pageSize: PAGE_SIZE,
    total: 0,
  });

  // Lấy danh sách zone names từ tables (đã có zoneName)
  const areas = useMemo(() => {
    const setAreas = new Set(tables.map(table => table.zoneName).filter(Boolean));
    return Array.from(setAreas);
  }, [tables]);

  // Lấy danh sách branch names
  const branches = useMemo(() => {
    const setBranches = new Set(tables.map(table => table.branchName).filter(Boolean));
    return Array.from(setBranches);
  }, [tables]);

  const filteredTables = useMemo(() => {
    // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
    console.log('[DEBUG useTableFilters] Đầu vào - tables:', tables.length, tables);
    console.log('[DEBUG useTableFilters] Trạng thái filters hiện tại:', filters);

    const result = tables.filter(table => {
      // Search theo tên bàn
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!table.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Lọc theo status (active/inactive)
      if (filters.status !== 'all' && table.status !== filters.status) {
        return false;
      }

      // Lọc theo khu vực (so sánh với zoneName)
      if (filters.area !== 'all' && table.zoneName !== filters.area) {
        return false;
      }

      // Lọc theo trạng thái sử dụng
      if (filters.usageStatus !== 'all' && table.usageStatus !== filters.usageStatus) {
        return false;
      }

      // Lọc theo chi nhánh
      if (filters.branch !== 'all' && table.branchName !== filters.branch) {
        return false;
      }

      return true;
    });

    // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
    console.log('[DEBUG useTableFilters] Kết quả sau khi lọc - filteredTables:', result.length, result);
    return result;
  }, [tables, filters]);

  // Tính phân trang
  const { paginatedTables, totalItems } = useMemo(() => {
    const total = filteredTables.length;
    // UI page bắt đầu từ 1, convert sang 0-based cho slice
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    return {
      paginatedTables: filteredTables.slice(start, end),
      totalItems: total,
    };
  }, [filteredTables, pagination.page, pagination.pageSize]);

  // Update total khi thay đổi
  useMemo(() => {
    if (pagination.total !== totalItems) {
      setPagination(prev => ({ ...prev, total: totalItems }));
    }
  }, [totalItems, pagination.total]);

  const updateFilter = useCallback((key: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset về trang 1
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      area: 'all',
      usageStatus: 'all',
      branch: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

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