import { Plus } from 'lucide-react';
import type { BranchFilters } from '@modules/branch/types/branch.types';
import { FilterTag } from '../FilterTag';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';

interface BranchFilterBarProps {
  filters: BranchFilters;
  locations: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddBranch: () => void;
}

/**
 * Bar filter, search và action buttons
 */
export const BranchFilterBar = ({
  filters,
  locations,
  onSearchChange,
  onStatusChange,
  onLocationChange,
  onClearFilters,
  hasActiveFilters,
  onAddBranch,
}: BranchFilterBarProps) => {
  const statusLabel =
    filters.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';
  const locationLabel = filters.location === 'all' ? null : filters.location;

  const statusOptions = [
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  ];

  const locationOptions = locations.map((location) => ({
    value: location,
    label: location,
  }));

  return (
    <div className="space-y-3">
      {/* Search Bar và Filters */}
      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={filters.search}
          onChange={onSearchChange}
          placeholder="Tìm tên, mã hoặc số điện thoại..."
        />

        <div className="flex gap-2">
          <FilterDropdown
            value={filters.status}
            onChange={onStatusChange}
            options={statusOptions}
            defaultLabel="Trạng thái"
          />

          <FilterDropdown
            value={filters.location}
            onChange={onLocationChange}
            options={locationOptions}
            defaultLabel="Khu vực"
          />
        </div>

        {/* Add Branch Button */}
        <button
          onClick={onAddBranch}
          className="btn-primary rounded-3xl flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Thêm chi nhánh
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
          {filters.status !== 'all' && (
            <FilterTag
              label={statusLabel}
              onRemove={() => onStatusChange('all')}
            />
          )}
          {locationLabel && (
            <FilterTag
              label={locationLabel}
              onRemove={() => onLocationChange('all')}
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
