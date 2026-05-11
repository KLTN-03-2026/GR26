import { useState, useMemo, useCallback } from 'react';
import type { StaffSummary, StaffFilters, PaginationState } from '../types/staff.types';

const PAGE_SIZE = 10;

// Chuẩn hóa keyword tìm kiếm để bỏ khoảng trắng thừa và không phân biệt hoa thường.
const normalizeStaffSearchText = (value?: string | null) =>
  (value ?? '').trim().toLocaleLowerCase('vi-VN');

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

  const [pagination, setPagination] = useState<Omit<PaginationState, 'total'>>({
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const normalizedKeyword = useMemo(
    () => normalizeStaffSearchText(filters.keyword),
    [filters.keyword]
  );

  // Lấy danh sách unique position names từ staff
  const positions = useMemo(() => {
    const unique = new Set(staffList.map(s => s.positionName).filter(Boolean));
    return Array.from(unique).sort();
  }, [staffList]);

  // Filter và search staff (client-side filtering)
  const filteredStaff = useMemo(() => {
    let result = [...staffList];

    // Search by keyword (fullName or phone)
    if (normalizedKeyword) {
      result = result.filter(member => {
        const searchableText = [
          normalizeStaffSearchText(member.fullName),
          normalizeStaffSearchText(member.phone),
        ].join(' ');

        return searchableText.includes(normalizedKeyword);
      });
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
  }, [staffList, normalizedKeyword, filters.status, filters.positionId]);

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

  const updateFilter = useCallback((key: keyof StaffFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ keyword: '', status: undefined, positionId: undefined });
    setPagination({ page: 1, pageSize: PAGE_SIZE });
  }, []);

  const updatePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!normalizedKeyword || !!filters.status || !!filters.positionId;
  }, [normalizedKeyword, filters.status, filters.positionId]);

  return {
    filters,
    pagination: {
      ...pagination,
      total: totalItems,
    },
    positions,
    staff: paginatedStaff,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages: Math.ceil(totalItems / pagination.pageSize),
  };
};
