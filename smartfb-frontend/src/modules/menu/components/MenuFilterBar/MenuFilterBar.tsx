import { type FC } from 'react';
import { cn } from '@shared/utils/cn';
import { FilterSection } from './FilterSection';
import { SearchInput } from './SearchInput';
import { CategoryFilter } from './CategoryFilter';
import { StatusFilter } from './StatusFilter';
import { SortFilter } from './SortFilter';
import { FilterFooter } from './FilterFooter';
import type { MenuCategory, MenuCategoryInfo, MenuFilters, MenuSortOption, MenuStatus } from '@modules/menu/types/menu.types';
import { DEFAULT_MENU_FILTERS } from '@modules/menu/utils';

interface MenuFilterBarProps {
  categories: MenuCategoryInfo[];
  filters: MenuFilters;
  statusCounts?: Partial<Record<MenuStatus, number>>;
  onFiltersChange: (filters: MenuFilters) => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
}

/**
 * Bộ lọc tìm kiếm cho Menu
 * Bao gồm: Search, Danh mục, Trạng thái, Khoảng giá, Sắp xếp
 */
export const MenuFilterBar: FC<MenuFilterBarProps> = ({
  categories,
  filters,
  statusCounts,
  onFiltersChange,
  onReset,
  onApply,
  className,
}) => {
  // Tính số lượng filter đang active
  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.categories.length > 0 ? 1 : 0,
    filters.statuses.length > 0 ? 1 : 0,
    filters.sortBy !== DEFAULT_MENU_FILTERS.sortBy ? 1 : 0,
  ].reduce((acc, curr) => acc + curr, 0);

  const handleCategoryChange = (category: MenuCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleStatusChange = (status: MenuStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };



  const handleSortChange = (sortBy: MenuSortOption) => {
    onFiltersChange({ ...filters, sortBy });
  };

  return (
    <div className={cn('rounded-3xl border border-amber-100 bg-white p-4 shadow-sm ', className)}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc tìm kiếm
        </h3>
       
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
          Tìm kiếm
        </label>
        <SearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Nhập tên sản phẩm"
        />
      </div>

      {/* Categories */}
      <FilterSection title="Danh mục">
        <CategoryFilter
          categories={categories}
          selectedCategories={filters.categories}
          onCategoryChange={handleCategoryChange}
        />
      </FilterSection>

      {/* Status */}
      <FilterSection title="Trạng thái kinh doanh">
        <StatusFilter
          selectedStatuses={filters.statuses}
          onStatusChange={handleStatusChange}
          statusCounts={statusCounts}
        />
      </FilterSection>


      {/* Sort */}
      <FilterSection title="Sắp xếp">
        <SortFilter
          value={filters.sortBy}
          onChange={handleSortChange}
        />
      </FilterSection>

      {/* Footer */}
      <FilterFooter
        activeFilterCount={activeFilterCount}
        onReset={onReset}
        onApply={onApply}
      />
    </div>
  );
};
