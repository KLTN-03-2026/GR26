import { useState, useMemo, useCallback } from 'react';
import type { ShiftTemplate, ShiftTemplateFilters, PaginationState } from '../types/shift.types';

const PAGE_SIZE = 10;

/**
 * Hook quản lý filter, search, và pagination cho danh sách ca mẫu
 */
export const useShiftTemplateFilters = (templates: ShiftTemplate[]) => {
    const [filters, setFilters] = useState<ShiftTemplateFilters>({
        search: '',
        active: 'all',
    });

    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        pageSize: PAGE_SIZE,
        total: 0,
    });

    // Filter và search templates
    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            // Search by name
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchName = template.name.toLowerCase().includes(searchLower);
                if (!matchName) {
                    return false;
                }
            }

            // Filter by active status
            if (filters.active !== 'all') {
                const isActive = filters.active === true;
                if (template.active !== isActive) {
                    return false;
                }
            }

            return true;
        });
    }, [templates, filters]);

    // Paginate filtered templates
    const { paginatedTemplates, totalItems } = useMemo(() => {
        const total = filteredTemplates.length;
        const startIdx = (pagination.page - 1) * pagination.pageSize;
        const endIdx = startIdx + pagination.pageSize;

        return {
            paginatedTemplates: filteredTemplates.slice(startIdx, endIdx),
            totalItems: total,
        };
    }, [filteredTemplates, pagination.page, pagination.pageSize]);

    const resolvedPagination = useMemo(
        () => ({
            ...pagination,
            total: totalItems,
        }),
        [pagination, totalItems]
    );

    const updateFilter = useCallback((key: keyof ShiftTemplateFilters, value: string | boolean) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        // Reset to page 1 when filter changes
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ search: '', active: 'all' });
        setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0 });
    }, []);

    const updatePage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    // Check if có active filters
    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' || filters.active !== 'all';
    }, [filters]);

    return {
        filters,
        pagination: resolvedPagination,
        templates: paginatedTemplates,
        totalItems,
        hasActiveFilters,
        updateFilter,
        clearFilters,
        updatePage,
        totalPages: Math.ceil(totalItems / pagination.pageSize),
    };
};