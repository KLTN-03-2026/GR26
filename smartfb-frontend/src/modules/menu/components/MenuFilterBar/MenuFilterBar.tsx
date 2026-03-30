import { type FC } from 'react';
import { cn } from '@shared/utils/cn';
import { FilterSection } from './FilterSection';
import { SearchInput } from './SearchInput';
import { CategoryFilter } from './CategoryFilter';
import { StatusFilter } from './StatusFilter';
import { PriceRangeFilter } from './PriceRangeFilter';
import { GpMarginFilter } from './GpMarginFilter';
import { SortFilter } from './SortFilter';
import { FilterFooter } from './FilterFooter';
import type { MenuFilters, MenuCategory, MenuStatus, GpMarginFilter as GpMarginFilterType, MenuSortOption } from '@modules/menu/types/menu.types';
import { DEFAULT_PRICE_RANGE } from '@modules/menu/constants/menu.constants';

interface MenuFilterBarProps {
  filters: MenuFilters;
  onFiltersChange: (filters: MenuFilters) => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
}

/**
 * Bộ lọc tìm kiếm cho Menu
 * Bao gồm: Search, Danh mục, Trạng thái, Khoảng giá, GP%, Sắp xếp
 */
export const MenuFilterBar: FC<MenuFilterBarProps> = ({
  filters,
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
    filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] || filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1] ? 1 : 0,
    filters.gpMargin !== 'all' ? 1 : 0,
    filters.sortBy !== 'newest' ? 1 : 0,
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

  const handlePriceRangeChange = (priceRange: [number, number]) => {
    onFiltersChange({ ...filters, priceRange });
  };

  const handleGpMarginChange = (gpMargin: GpMarginFilterType) => {
    onFiltersChange({ ...filters, gpMargin });
  };

  const handleSortChange = (sortBy: MenuSortOption) => {
    onFiltersChange({ ...filters, sortBy });
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc tìm kiếm
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
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
          selectedCategories={filters.categories}
          onCategoryChange={handleCategoryChange}
        />
      </FilterSection>

      {/* Status */}
      <FilterSection title="Trạng thái kinh doanh">
        <StatusFilter
          selectedStatuses={filters.statuses}
          onStatusChange={handleStatusChange}
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Khoảng giá (VNĐ)">
        <PriceRangeFilter
          value={filters.priceRange}
          onChange={handlePriceRangeChange}
        />
      </FilterSection>

      {/* GP Margin */}
      <FilterSection title="Lợi nhuận gộp (GP%)">
        <GpMarginFilter
          value={filters.gpMargin}
          onChange={handleGpMarginChange}
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
