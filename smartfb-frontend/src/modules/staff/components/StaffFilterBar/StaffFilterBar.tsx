import { Plus } from 'lucide-react';
import { FilterTag } from '../FilterTag';
import type { StaffFilters } from '../../types/staff.types';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';

interface StaffFilterBarProps {
  filters: StaffFilters;
  positions: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddStaff: () => void;
}

/**
 * Thanh filter cho danh sách nhân viên
 * Đã cập nhật theo Module 4 Spec (positionId)
 */
export const StaffFilterBar = ({
  filters,
  positions,
  branches,
  onSearchChange,
  onStatusChange,
  onPositionChange,
  onBranchChange,
  onClearFilters,
  hasActiveFilters,
  onAddStaff,
}: StaffFilterBarProps) => {
  const statusLabel = filters.status === 'active' ? 'Đang làm' 
    : filters.status === 'inactive' ? 'Đã nghỉ' 
    : '';
  const positionLabel = positions.find(p => p.id === filters.positionId)?.name;
  const branchLabel = branches.find(b => b.id === filters.branchId)?.name;

  const statusOptions = [
    { value: 'active', label: 'Đang làm' },
    { value: 'inactive', label: 'Đã nghỉ' },
  ];

  const positionOptions = positions.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchBar
          value={filters.search}
          onChange={onSearchChange}
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
        />
        <div className="flex gap-2 flex-wrap">
          <FilterDropdown
            value={filters.branchId}
            onChange={onBranchChange}
            options={branchOptions}
            defaultLabel="Tất cả chi nhánh"
          />
          <FilterDropdown
            value={filters.status}
            onChange={onStatusChange}
            options={statusOptions}
            defaultLabel="Trạng thái"
          />
          <FilterDropdown
            value={filters.positionId}
            onChange={onPositionChange}
            options={positionOptions}
            defaultLabel="Chức vụ"
          />
        </div>
        <button
          onClick={onAddStaff}
          className="btn-primary rounded-3xl flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </button>
      </div>
      {hasActiveFilters && (
        <div className="flex gap-2 items-center flex-wrap">
          {filters.search && (
            <FilterTag label={`Tìm: "${filters.search}"`} onRemove={() => onSearchChange('')} />
          )}
          {branchLabel && filters.branchId !== 'all' && (
            <FilterTag label={branchLabel} onRemove={() => onBranchChange('all')} />
          )}
          {positionLabel && filters.positionId !== 'all' && (
            <FilterTag label={positionLabel} onRemove={() => onPositionChange('all')} />
          )}
          {filters.status !== 'all' && (
            <FilterTag label={statusLabel} onRemove={() => onStatusChange('all')} />
          )}
          <button
            onClick={onClearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
          >
            Xóa hết
          </button>
        </div>
      )}
    </div>
  );
};