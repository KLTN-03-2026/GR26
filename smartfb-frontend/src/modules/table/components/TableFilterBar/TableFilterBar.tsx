import { Plus, FilterX } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { TableFilters } from '@modules/table/types/table.types';
import { TableUsageStatusValues } from '@modules/table/types/table.types';
import { FilterDropdown } from './FilterDropdown';

interface TableFilterBarProps {
  filters: TableFilters;
  areas: string[];
  branches: string[];
  onSearchChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onUsageStatusChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddTable: () => void;
  disabled?: boolean;
}

export const TableFilterBar = ({
  filters,
  areas,
  branches,
  onSearchChange,
  onAreaChange,
  onStatusChange,
  onUsageStatusChange,
  onBranchChange,
  onClearFilters,
  hasActiveFilters,
  onAddTable,
  disabled = false,
}: TableFilterBarProps) => {
  const areaOptions = areas.map((area) => ({ value: area, label: area }));
  const branchOptions = branches.map((branch) => ({ value: branch, label: branch }));

  const statusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Ngưng hoạt động' },
  ];

  const usageOptions = [
    { value: TableUsageStatusValues.AVAILABLE, label: 'Trống' },
    { value: TableUsageStatusValues.OCCUPIED, label: 'Đang phục vụ' },
    { value: TableUsageStatusValues.UNPAID, label: 'Chưa thanh toán' },
    { value: TableUsageStatusValues.RESERVED, label: 'Đã đặt trước' },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Ô tìm kiếm */}
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Tìm kiếm bàn..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input w-full pl-10"
          disabled={disabled}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <FilterDropdown
        value={filters.area}
        onChange={onAreaChange}
        options={areaOptions}
        placeholder="Khu vực"
        className="w-36"
      />

      <FilterDropdown
        value={filters.branch}
        onChange={onBranchChange}
        options={branchOptions}
        placeholder="Chi nhánh"
        className="w-36"
      />

      <FilterDropdown
        value={filters.status}
        onChange={onStatusChange}
        options={statusOptions}
        placeholder="Trạng thái hoạt động"
        className="w-44"
      />

      <FilterDropdown
        value={filters.usageStatus}
        onChange={onUsageStatusChange}
        options={usageOptions}
        placeholder="Trạng thái sử dụng"
        className="w-44"
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          disabled={disabled}
          className="text-gray-500 hover:text-red-600"
        >
          <FilterX className="h-4 w-4 mr-1" />
          Xóa lọc
        </Button>
      )}

      <Button onClick={onAddTable} disabled={disabled} className="gap-2">
        <Plus className="h-4 w-4" />
        Thêm bàn
      </Button>
    </div>
  );
};
