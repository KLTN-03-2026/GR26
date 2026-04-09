import { useState, useMemo, useCallback, useEffect } from 'react';
import type { StaffSummary, StaffFilters, PaginationState } from '../types/staff.types';

const PAGE_SIZE = 10;

/**
 * Hook quản lý filter, search, và pagination cho danh sách nhân viên
 * Đáp ứng PB09: Tìm kiếm và lọc nhân viên
 * Đã sửa để dùng API response structure
 */
export const useStaffFilters = (staffList: StaffSummary[]) => {
  const [filters, setFilters] = useState<StaffFilters>({
    keyword: '',
    status: undefined,
    positionId: undefined,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  // Lấy danh sách unique position names từ staff
  const positions = useMemo(() => {
    const unique = new Set(staffList.map(s => s.positionName).filter(Boolean));
    return Array.from(unique).sort();
  }, [staffList]);

  // Filter và search staff (client-side filtering)
  const filteredStaff = useMemo(() => {
    let result = [...staffList];

    // Search by keyword (fullName or phone)
    if (filters.keyword) {
      const keywordLower = filters.keyword.toLowerCase();
      result = result.filter(member => 
        member.fullName?.toLowerCase().includes(keywordLower) ||
        member.phone?.toLowerCase().includes(keywordLower)
      );
    }

    // Filter by status
    if (filters.status) {
      result = result.filter(member => member.status === filters.status);
    }

    // Filter by position
    if (filters.positionId) {
      result = result.filter(member => member.positionId === filters.positionId);
    }

    return result;
  }, [staffList, filters]);

  // Paginate filtered staff
  const { paginatedStaff, totalItems } = useMemo(() => {
    const total = filteredStaff.length;
    const startIdx = (pagination.page - 1) * pagination.pageSize;
    const endIdx = startIdx + pagination.pageSize;
    const items = filteredStaff.slice(startIdx, endIdx);

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

  const updateFilter = useCallback((key: keyof StaffFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ keyword: '', status: undefined, positionId: undefined });
    setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0 });
  }, []);

  const updatePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!filters.keyword || !!filters.status || !!filters.positionId;
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