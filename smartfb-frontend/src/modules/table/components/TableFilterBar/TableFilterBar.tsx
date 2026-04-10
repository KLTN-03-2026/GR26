import { FilterX, Layers3, MapPinned, Plus, Search, SquarePen } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { TableFilters } from '@modules/table/types/table.types';
import { FilterDropdown } from './FilterDropdown';

interface TableFilterBarProps {
  filters: TableFilters;
  areas: Array<{ value: string; label: string }>;
  onSearchChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onCreateSingleTable: () => void;
  onCreateBulkTables: () => void;
  onManageZones: () => void;
  disabled?: boolean;
}

export const TableFilterBar = ({
  filters,
  areas,
  onSearchChange,
  onAreaChange,
  onStateChange,
  onClearFilters,
  hasActiveFilters,
  onCreateSingleTable,
  onCreateBulkTables,
  onManageZones,
  disabled = false,
}: TableFilterBarProps) => {
  const stateOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'occupied', label: 'Có khách' },
    { value: 'inactive', label: 'Không hoạt động' },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bàn..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
          <FilterDropdown
            value={filters.area}
            onChange={onAreaChange}
            options={areas}
            placeholder="Khu vực"
            className="w-full sm:w-[180px]"
          />

          <FilterDropdown
            value={filters.state}
            onChange={onStateChange}
            options={stateOptions}
            placeholder="Trạng thái"
            className="w-full sm:w-[190px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              disabled={disabled}
              className="h-10 rounded-xl px-4 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
            >
              <FilterX className="mr-1.5 h-4 w-4" />
              Xóa lọc
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={disabled}
                className="h-10 gap-2 rounded-xl bg-primary px-5 text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                Tạo mới
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-gray-100 p-2 shadow-lg">
              <DropdownMenuLabel>Quản lý bàn và khu vực</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onManageZones} className="cursor-pointer gap-3 rounded-lg py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPinned className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">Quản lý khu vực</span>
                  <span className="text-xs text-gray-500">Tạo mới, sửa và xóa khu vực trong modal</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateSingleTable} className="cursor-pointer gap-3 rounded-lg py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <SquarePen className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">Tạo từng bàn</span>
                  <span className="text-xs text-gray-500">Nhập thủ công cho một bàn</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateBulkTables} className="cursor-pointer gap-3 rounded-lg py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Layers3 className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">Tạo hàng loạt</span>
                  <span className="text-xs text-gray-500">Sinh nhiều bàn theo tiền tố và số thứ tự</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
