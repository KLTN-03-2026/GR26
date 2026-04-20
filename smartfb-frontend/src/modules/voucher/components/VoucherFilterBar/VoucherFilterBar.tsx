/**
 * @author Đào Thu Thiên
 * @description Bar filter, search và action buttons cho voucher
 * @created 2026-04-16
 */

import { Plus } from 'lucide-react';
import type { VoucherFilters } from '../../types/voucher.types';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { FilterTag } from '../FilterTag';

interface VoucherFilterBarProps {
    filters: VoucherFilters;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
    onAddVoucher: () => void;
}

const statusOptions = [
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'INACTIVE', label: 'Vô hiệu hóa' },
    { value: 'EXPIRED', label: 'Hết hạn' },
];

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'INACTIVE':
            return 'Vô hiệu hóa';
        case 'EXPIRED':
            return 'Hết hạn';
        default:
            return status;
    }
};

export const VoucherFilterBar = ({
    filters,
    onSearchChange,
    onStatusChange,
    onClearFilters,
    hasActiveFilters,
    onAddVoucher,
}: VoucherFilterBarProps) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
                <SearchBar
                    value={filters.search}
                    onChange={onSearchChange}
                    placeholder="Tìm theo mã hoặc tên chương trình..."
                />

                <div className="flex gap-2">
                    <FilterDropdown
                        value={filters.status}
                        onChange={onStatusChange}
                        options={statusOptions}
                        defaultLabel="Trạng thái"
                    />
                </div>

                <button
                    onClick={onAddVoucher}
                    className="btn-primary rounded-3xl flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Thêm voucher
                </button>
            </div>

            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.search && (
                        <FilterTag
                            label={`"${filters.search}"`}
                            onRemove={() => onSearchChange('')}
                        />
                    )}
                    {filters.status !== 'all' && (
                        <FilterTag
                            label={getStatusLabel(filters.status)}
                            onRemove={() => onStatusChange('all')}
                        />
                    )}
                    <button
                        onClick={onClearFilters}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium ml-auto flex items-center"
                    >
                        Xoá tất cả
                    </button>
                </div>
            )}
        </div>
    );
};