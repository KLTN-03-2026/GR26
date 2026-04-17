/**
 * @author Đào Thu Thiên
 * @description Hook quản lý filter, search và pagination cho danh sách voucher
 * @created 2026-04-16
 */

import { useState, useMemo, useCallback } from 'react';
import type { VoucherFilters, VoucherListItem, PaginationState } from '../types/voucher.types';

const PAGE_SIZE = 10;

export const useVoucherFilters = (vouchers: VoucherListItem[]) => {
    const [filters, setFilters] = useState<VoucherFilters>({
        search: '',
        status: 'all',
    });

    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        pageSize: PAGE_SIZE,
        total: 0,
    });

    // Filter và search vouchers
    const filteredVouchers = useMemo(() => {
        return vouchers.filter(voucher => {
            // Search by code or name
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchCode = voucher.code.toLowerCase().includes(searchLower);
                const matchName = voucher.name.toLowerCase().includes(searchLower);

                if (!matchCode && !matchName) {
                    return false;
                }
            }

            // Filter by status
            if (filters.status !== 'all' && voucher.status !== filters.status) {
                return false;
            }

            return true;
        });
    }, [vouchers, filters]);

    // Paginate filtered vouchers
    const { paginatedVouchers, totalItems } = useMemo(() => {
        const total = filteredVouchers.length;
        const startIdx = (pagination.page - 1) * pagination.pageSize;
        const endIdx = startIdx + pagination.pageSize;

        return {
            paginatedVouchers: filteredVouchers.slice(startIdx, endIdx),
            totalItems: total,
        };
    }, [filteredVouchers, pagination.page, pagination.pageSize]);

    const resolvedPagination = useMemo(
        () => ({
            ...pagination,
            total: totalItems,
        }),
        [pagination, totalItems]
    );

    const updateFilter = useCallback((key: keyof VoucherFilters, value: string) => {
        setFilters((prev: VoucherFilters) => ({ ...prev, [key]: value }));
        setPagination((prev: PaginationState) => ({ ...prev, page: 1 }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ search: '', status: 'all' });
        setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0 });
    }, []);

    const updatePage = useCallback((page: number) => {
        setPagination((prev: PaginationState) => ({ ...prev, page }));
    }, []);

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' || filters.status !== 'all';
    }, [filters]);

    return {
        filters,
        pagination: resolvedPagination,
        vouchers: paginatedVouchers,
        totalItems,
        hasActiveFilters,
        updateFilter,
        clearFilters,
        updatePage,
        totalPages: Math.ceil(totalItems / pagination.pageSize),
    };
};