import { useState, useMemo, useCallback, useEffect } from 'react';
import type { StaffDetail } from '../data/staffList';
import type { StaffFilters, PaginationState } from '../types/staff.types';

const PAGE_SIZE = 10;

/**
 * Hook quản lý filter, search, và pagination cho danh sách nhân viên
 * Đã cập nhật theo Module 4 Spec (fullName, positionId)
 */
export const useStaffFilters = (staff: StaffDetail[]) => {
  const [filters, setFilters] = useState<StaffFilters>({
    search: '',
    status: 'all',
    positionId: 'all',
    branchId: 'all',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  // Lấy danh sách unique positions từ staff
  const positions = useMemo(() => {
    const unique = new Map<string, string>();
    staff.forEach(s => {
      if (s.positionId && s.positionName) {
        unique.set(s.positionId, s.positionName);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [staff]);

  // Filter và search staff
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      // Search by name or phone
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = member.fullName.toLowerCase();
        const matchName = fullName.includes(searchLower);
        const matchPhone = member.phone?.toLowerCase().includes(searchLower);
        if (!matchName && !matchPhone) return false;
      }

      // Filter by status
      if (filters.status !== 'all' && member.status !== filters.status) {
        return false;
      }

      // Filter by position
      if (filters.positionId !== 'all' && member.positionId !== filters.positionId) {
        return false;
      }

      // Filter by branch
      if (filters.branchId !== 'all' && member.branchId !== filters.branchId) {
        return false;
      }

      return true;
    });
  }, [staff, filters]);

  // Paginate filtered staff
  const { paginatedStaff, totalItems } = useMemo(() => {
    const total = filteredStaff.length;
    const startIdx = (pagination.page - 1) * pagination.pageSize;
    const endIdx = startIdx + pagination.pageSize;

    const items = filteredStaff.slice(startIdx, endIdx).map(member => ({
      ...member,
      salaryDisplay: member.salary
        ? member.salary.toLocaleString('vi-VN')
        : '0',
    }));

    return {
      paginatedStaff: items,
      totalItems: total,
    };
  }, [filteredStaff, pagination.page, pagination.pageSize]);

  // Update pagination total when filtered results change
  useEffect(() => {
    if (pagination.total !== totalItems) {
      setPagination(prev => ({ ...prev, total: totalItems }));
    }
  }, [totalItems, pagination.total]);

  const updateFilter = useCallback((key: keyof StaffFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filter changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', positionId: 'all', branchId: 'all' });
    setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0 });
  }, []);

  const updatePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Check if có active filters
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.status !== 'all' || filters.positionId !== 'all' || filters.branchId !== 'all';
  }, [filters]);

  return {
    filters,
    pagination,
    positions,
    staff: paginatedStaff,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages: Math.ceil(pagination.total / pagination.pageSize),
  };
};