import { useState, useMemo, useCallback } from 'react';
import type { BranchDetail } from '../data/branchDetails';
import type { BranchFilters, PaginationState } from '../types/branch.types';

const PAGE_SIZE = 10;

/**
 * Hook quản lý filter, search, và pagination cho danh sách chi nhánh
 */
export const useBranchFilters = (branches: BranchDetail[]) => {
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
        const matchAddress = branch.address?.toLowerCase().includes(searchLower);
        if (!matchName && !matchAddress) return false;
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

    const items = filteredBranches.slice(startIdx, endIdx).map(branch => ({
      ...branch,
      revenueDisplay: branch.revenue
        ? branch.revenue.toLocaleString('vi-VN')
        : '0',
    }));

    return {
      paginatedBranches: items,
      totalItems: total,
    };
  }, [filteredBranches, pagination.page, pagination.pageSize]);

  // Update pagination total when filtered results change
  useMemo(() => {
    if (pagination.total !== totalItems) {
      setPagination(prev => ({ ...prev, total: totalItems }));
    }
  }, [totalItems, pagination.total]);

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
    pagination,
    locations,
    branches: paginatedBranches,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages: Math.ceil(pagination.total / pagination.pageSize),
  };
};
