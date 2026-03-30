import { useState, useMemo, useEffect } from 'react';
import { MenuCard } from '@modules/menu/components/MenuCard/MenuCard';
import { MenuCardGrid } from '@modules/menu/components/MenuCard/MenuCardGrid';
import { MenuCardSkeleton } from '@modules/menu/components/MenuCard/MenuCardSkeleton';
import { MenuPagination } from '@modules/menu/components/MenuPagination/MenuPagination';
import { MenuFilterBar } from '@modules/menu/components/MenuFilterBar/MenuFilterBar';
import { AddMenuDialog } from '@modules/menu/components/AddMenuDialog/AddMenuDialog';
// custome hooks
import { useMenus,useToggleMenu ,useDeleteMenu } from '@modules/menu/hooks/';
import type { MenuFilters, MenuPaginationState } from '@modules/menu/types/menu.types';
import { DEFAULT_PRICE_RANGE, DEFAULT_PAGE_SIZE } from '@modules/menu/constants/menu.constants';
import { Button } from '@shared/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';

/**
 * Trang quản lý thực đơn
 * Hiển thị danh sách món ăn với filter và pagination
 */
export default function MenuPage() {
  const [showFilter, setShowFilter] = useState(true);
  const [filters, setFilters] = useState<MenuFilters>({
    search: '',
    categories: [],
    statuses: [],
    priceRange: DEFAULT_PRICE_RANGE,
    gpMargin: 'all',
    sortBy: 'newest',
  });

  const [pagination, setPagination] = useState<MenuPaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    lastPage: 1,
  });

  // Fetch data từ API (mock)
  const { data, isLoading, isError } = useMenus({
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  const { mutate: toggleMenu } = useToggleMenu();
  const { mutate: deleteMenu } = useDeleteMenu();

  // Reset pagination về page 1 khi filter thay đổi
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters]);

  // Filter và sort data
  const filteredAndSortedMenus = useMemo(() => {
    if (!data?.data) return [];

    let result = [...data.data];

    // Filter by search
    if (filters.search) {
      result = result.filter((menu) =>
        menu.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter((menu) =>
        filters.categories.includes(menu.category)
      );
    }

    // Filter by statuses
    if (filters.statuses.length > 0) {
      result = result.filter((menu) =>
        filters.statuses.includes(menu.status)
      );
    }

    // Filter by price range
    if (
      filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
      filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1]
    ) {
      result = result.filter(
        (menu) =>
          menu.price >= filters.priceRange[0] &&
          menu.price <= filters.priceRange[1]
      );
    }

    // Filter by GP margin
    if (filters.gpMargin !== 'all') {
      result = result.filter((menu) => {
        const above50 = menu.gpPercent > 50;
        return filters.gpMargin === 'above-50' ? above50 : !above50;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'bestseller':
        result.sort((a, b) => b.soldCount - a.soldCount);
        break;
    }

    return result;
  }, [data?.data, filters]);

  // Pagination
  const paginatedMenus = useMemo(() => {
    const startIdx = (pagination.page - 1) * pagination.pageSize;
    const endIdx = startIdx + pagination.pageSize;
    return filteredAndSortedMenus.slice(startIdx, endIdx);
  }, [filteredAndSortedMenus, pagination.page, pagination.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedMenus.length / pagination.pageSize);

  const handleFiltersChange = (newFilters: MenuFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      statuses: [],
      priceRange: DEFAULT_PRICE_RANGE,
      gpMargin: 'all',
      sortBy: 'newest',
    });
  };

  const handleApplyFilters = () => {
    // Filters đã được apply ngay khi thay đổi
  };

  const handleToggle = (id: string, isAvailable: boolean) => {
    toggleMenu({ id, isAvailable });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
      deleteMenu(id);
    }
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit dialog
    console.log('Edit menu:', id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button className="bg-amber-600 hover:bg-amber-700" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Thêm món mới
          </Button>
        </div>
        <MenuCardGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <MenuCardSkeleton key={i} />
          ))}
        </MenuCardGrid>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium">Có lỗi xảy ra khi tải thực đơn</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Filter Sidebar */}
      {showFilter && (
        <div className="w-64 flex-shrink-0">
          <MenuFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            onApply={handleApplyFilters}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className="gap-2"
          >
            {showFilter ? (
              <>
                <PanelLeftClose className="w-4 h-4" />
                Ẩn bộ lọc
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4" />
                Hiện bộ lọc
              </>
            )}
          </Button>
          <AddMenuDialog />
        </div>

        {/* Menu Grid */}
        {paginatedMenus.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 font-medium">Không tìm thấy món ăn nào</p>
              <p className="text-sm text-gray-400 mt-1">
                Thử điều chỉnh bộ lọc hoặc thêm món mới
              </p>
            </div>
          </div>
        ) : (
          <>
            <MenuCardGrid>
              {paginatedMenus.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </MenuCardGrid>

            {/* Pagination */}
            <div className="mt-6">
              <MenuPagination
                currentPage={pagination.page}
                totalPages={totalPages}
                totalItems={filteredAndSortedMenus.length}
                pageSize={pagination.pageSize}
                onPageChange={(page) =>
                  setPagination((prev) => ({ ...prev, page }))
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
