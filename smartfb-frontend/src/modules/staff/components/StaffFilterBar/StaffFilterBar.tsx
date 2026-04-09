import { Plus } from 'lucide-react';
import type { StaffFilters } from '@modules/staff/types/staff.types';
import { FilterTag } from '../FilterTag';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';

interface StaffFilterBarProps {
  filters: StaffFilters;
  positions: string[]; // Mảng các tên chức vụ (positionName)
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
    // positions là mảng các positionName, nhưng filter dùng positionId
    // Nếu backend trả về positionName, cần map từ positionId
    return positionId; // Tạm thời trả về ID, sau này có thể map nếu cần
  };

  const statusLabel = getStatusLabel(filters.status);
  const positionLabel = getPositionLabel(filters.positionId);

  const statusOptions = [
    { value: 'ACTIVE', label: 'Đang làm' },
    { value: 'INACTIVE', label: 'Đã nghỉ' },
  ];

  // Chuyển positions (mảng string) thành options
  const positionOptions = positions.map((posName) => ({
    value: posName, // Dùng tên chức vụ làm value
    label: posName,
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