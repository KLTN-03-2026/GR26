import { Plus } from 'lucide-react';
import type { ShiftTemplateFilters } from '@modules/shift/types/shift.types';
import { FilterTag } from '@modules/branch/components/FilterTag';
import { SearchBar } from '@modules/branch/components/BranchFilterBar/SearchBar';
import { FilterDropdown } from '@modules/branch/components/BranchFilterBar/FilterDropdown';

interface ShiftTemplateFilterBarProps {
    filters: ShiftTemplateFilters;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string | boolean) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
    onAddTemplate: () => void;
}

/**
 * Bar filter, search và action buttons cho Shift Template
 */
export const ShiftTemplateFilterBar = ({
    filters,
    onSearchChange,
    onStatusChange,
    onClearFilters,
    hasActiveFilters,
    onAddTemplate,
}: ShiftTemplateFilterBarProps) => {
    const statusOptions = [
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Ngưng hoạt động' },
    ];

    // Convert filter.active (boolean | 'all') sang string cho dropdown
    const getStatusValue = () => {
        if (filters.active === true) return 'active';
        if (filters.active === false) return 'inactive';
        return 'all';
    };

    // Convert dropdown value sang filter.active
    const handleStatusChange = (value: string) => {
        if (value === 'all') onStatusChange('all');
        if (value === 'active') onStatusChange(true);
        if (value === 'inactive') onStatusChange(false);
    };

    const getStatusLabel = () => {
        if (filters.active === true) return 'Hoạt động';
        if (filters.active === false) return 'Ngưng hoạt động';
        return null;
    };

    const statusLabel = getStatusLabel();

    return (
        <div className="space-y-3">
            {/* Search Bar và Filters */}
            <div className="flex items-center justify-between gap-4">
                <SearchBar
                    value={filters.search}
                    onChange={onSearchChange}
                    placeholder="Tìm kiếm ca mẫu..."
                />

                <div className="flex gap-2">
                    <FilterDropdown
                        value={getStatusValue()}
                        onChange={handleStatusChange}
                        options={statusOptions}
                        defaultLabel="Trạng thái"
                    />
                </div>

                {/* Add Template Button */}
                <button
                    onClick={onAddTemplate}
                    className="btn-primary rounded-3xl flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Thêm ca mẫu
                </button>
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.search && (
                        <FilterTag
                            label={`"${filters.search}"`}
                            onRemove={() => onSearchChange('')}
                        />
                    )}
                    {filters.active !== 'all' && statusLabel && (
                        <FilterTag
                            label={statusLabel}
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