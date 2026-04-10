import { useState, useMemo, useCallback } from 'react';
import type { BranchFilters, BranchListItem, PaginationState } from '../types/branch.types';

const PAGE_SIZE = 10;

/**
 * Hook quản lý filter, search, và pagination cho danh sách chi nhánh
 */
export const useBranchFilters = (branches: BranchListItem[]) => {
  const [filters, setFilters] = useState<BranchFilters>({
    search: '',
    status: 'all',
    location: 'all',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  // Lấy danh sách unique locations từ branches
  const locations = useMemo(() => {
    const unique = new Set(branches.map(b => b.location).filter(Boolean));
    return Array.from(unique).sort();
  }, [branches]);

  // Filter và search branches
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      // Search by name, address
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchName = branch.name.toLowerCase().includes(searchLower);
        const matchCode = branch.code.toLowerCase().includes(searchLower);
        const matchAddress = branch.address?.toLowerCase().includes(searchLower);
        const matchPhone = branch.phone?.toLowerCase().includes(searchLower);

        if (!matchName && !matchCode && !matchAddress && !matchPhone) {
          return false;
        }
      }

      // Filter by status
      if (filters.status !== 'all' && branch.status !== filters.status) {
        return false;
      }

      // Filter by location
      if (filters.location !== 'all' && branch.location !== filters.location) {
        return false;
      }

      return true;
    });
  }, [branches, filters]);

  // Paginate filtered branches
  const { paginatedBranches, totalItems } = useMemo(() => {
    const total = filteredBranches.length;
    const startIdx = (pagination.page - 1) * pagination.pageSize;
    const endIdx = startIdx + pagination.pageSize;

    return {
      paginatedBranches: filteredBranches.slice(startIdx, endIdx),
      totalItems: total,
    };
  }, [filteredBranches, pagination.page, pagination.pageSize]);

  const resolvedPagination = useMemo(
    () => ({
      ...pagination,
      total: totalItems,
    }),
    [pagination, totalItems]
  );

  const updateFilter = useCallback((key: keyof BranchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filter changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', location: 'all' });
    setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0 });
  }, []);

  const updatePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Check if có active filters
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.status !== 'all' || filters.location !== 'all';
  }, [filters]);

  return {
    filters,
    pagination: resolvedPagination,
    locations,
    branches: paginatedBranches,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages: Math.ceil(totalItems / pagination.pageSize),
  };
};
