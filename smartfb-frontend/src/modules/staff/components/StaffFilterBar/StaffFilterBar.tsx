import { Plus } from 'lucide-react';
import type { StaffFilters } from '@modules/staff/types/staff.types';
import { FilterTag } from '../FilterTag';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';

interface PositionOption {
  id: string;
  name: string;
}

interface StaffFilterBarProps {
  filters: StaffFilters;
  positions: PositionOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddStaff: () => void;
}

export const StaffFilterBar = ({
  filters,
  positions,
  onSearchChange,
  onStatusChange,
  onPositionChange,
  onClearFilters,
  hasActiveFilters,
  onAddStaff,
}: StaffFilterBarProps) => {
  // Tìm label cho status
  const getStatusLabel = (status?: string) => {
    if (status === 'ACTIVE') return 'Đang làm';
    if (status === 'INACTIVE') return 'Đã nghỉ';
    return '';
  };

  // Tìm label cho position (dựa trên positionId)
  const getPositionLabel = (positionId?: string) => {
    if (!positionId) return null;
    return positions.find((position) => position.id === positionId)?.name ?? positionId;
  };

  const statusLabel = getStatusLabel(filters.status);
  const positionLabel = getPositionLabel(filters.positionId);

  const statusOptions = [
    { value: 'ACTIVE', label: 'Đang làm' },
    { value: 'INACTIVE', label: 'Đã nghỉ' },
  ];

  // Dùng `positionId` làm value để đồng bộ với API filter của backend.
  const positionOptions = positions.map((position) => ({
    value: position.id,
    label: position.name,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchBar
          value={filters.keyword || ''}
          onChange={onSearchChange}
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
        />
        <div className="flex gap-2 flex-wrap">
          <FilterDropdown
            value={filters.status || 'all'}
            onChange={onStatusChange}
            options={statusOptions}
            defaultLabel="Trạng thái"
          />
          <FilterDropdown
            value={filters.positionId || 'all'}
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
          {filters.keyword && (
            <FilterTag label={`Tìm: "${filters.keyword}"`} onRemove={() => onSearchChange('')} />
          )}
          {positionLabel && positionLabel !== 'all' && (
            <FilterTag label={positionLabel} onRemove={() => onPositionChange('all')} />
          )}
          {filters.status && (
            <FilterTag label={statusLabel} onRemove={() => onStatusChange('all')} />
          )}
          <button
            onClick={onClearFilters}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1"
          >
            Xóa hết
          </button>
        </div>
      )}
    </div>
  );
};
