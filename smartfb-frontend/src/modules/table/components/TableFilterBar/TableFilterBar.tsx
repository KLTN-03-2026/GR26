import { Plus, FilterX, Search } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-wrap">

      {/* Ô tìm kiếm - Tăng chiều dài */}
      <div className="relative flex-1 min-w-[280px] md:max-w-[400px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm bàn theo tên..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          disabled={disabled}
        />
      </div>

      {/* Bộ lọc khu vực - Tăng độ dài */}
      <FilterDropdown
        value={filters.area}
        onChange={onAreaChange}
        options={areaOptions}
        placeholder="Tất cả khu vực"
        className="w-44 md:w-52"
      />

      {/* Chỉ hiển thị branch filter nếu có nhiều hơn 1 branch */}
      {branches.length > 1 && (
        <FilterDropdown
          value={filters.branch}
          onChange={onBranchChange}
          options={branchOptions}
          placeholder="Tất cả chi nhánh"
          className="w-44 md:w-52"
        />
      )}

      {/* Bộ lọc trạng thái hoạt động */}
      <FilterDropdown
        value={filters.status}
        onChange={onStatusChange}
        options={statusOptions}
        placeholder="Tất cả trạng thái"
        className="w-40 md:w-48"
      />

      {/* Bộ lọc trạng thái sử dụng */}
      <FilterDropdown
        value={filters.usageStatus}
        onChange={onUsageStatusChange}
        options={usageOptions}
        placeholder="Tất cả trạng thái SD"
        className="w-44 md:w-52"
      />

      {/* Nút xóa lọc */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          disabled={disabled}
          className="h-10 px-4 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <FilterX className="h-4 w-4 mr-1.5" />
          Xóa lọc
        </Button>
      )}

      {/* Nút thêm bàn */}
      <div className="flex-1 md:flex-none md:ml-auto">
        <Button
          onClick={onAddTable}
          disabled={disabled}
          className="h-10 px-5 gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Thêm bàn
        </Button>
      </div>
    </div>
  );
};