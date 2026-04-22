import { PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from 'lucide-react';
import { AddMenuDialog } from '@modules/menu/components/AddMenuDialog/AddMenuDialog';
import { AddonManagementDialog } from '@modules/menu/components/AddonManagementDialog/AddonManagementDialog';
import { BranchMenuConfigDialog } from '@modules/menu/components/BranchMenuConfigDialog/BranchMenuConfigDialog';
import { CategoryManagementDialog } from '@modules/menu/components/CategoryManagementDialog/CategoryManagementDialog';
import { MenuCard } from '@modules/menu/components/MenuCard/MenuCard';
import { MenuCardGrid } from '@modules/menu/components/MenuCard/MenuCardGrid';
import { MenuFilterBar } from '@modules/menu/components/MenuFilterBar/MenuFilterBar';
import { MenuPagination } from '@modules/menu/components/MenuPagination/MenuPagination';
import { useMenuManagement } from '@modules/menu/hooks';
import { Button } from '@shared/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@shared/components/ui/sheet';
import { MenuManagementErrorState } from './MenuManagementErrorState';
import { MenuManagementLoadingState } from './MenuManagementLoadingState';

/**
 * Thành phần chính của màn quản lý thực đơn.
 * Route page chỉ nên mount component này để giữ đúng module boundary.
 */
export const MenuManagementContent = () => {
  const {
    activeFilterCount,
    canManageMenu,
    categories,
    categoryManagementItems,
    configuringBranchMenu,
    currentPage,
    debouncedSearch,
    editingMenu,
    filteredMenuCount,
    filters,
    isAddonError,
    isAddonFetching,
    isAddonLoading,
    isBranchConfigFetching,
    isBranchConfigLoading,
    isBranchMode,
    isCategoryError,
    isCategoryFetching,
    isCategoryLoading,
    isError,
    isFetching,
    isFilterSheetOpen,
    isLoading,
    isUpdatingBranchMenuItem,
    nextCategoryDisplayOrder,
    onApplyFilters,
    onConfigureBranchMenu,
    onDeleteMenu,
    onEditMenu,
    onFilterChange,
    onFilterReset,
    onPageChange,
    onRefetchCategories,
    onRefetchMenus,
    onRetryAddons,
    onSubmitBranchConfig,
    onToggleMenu,
    onUpdateBranchConfigOpen,
    onUpdateEditingMenuOpen,
    paginatedMenus,
    rawAddons,
    selectedBranchName,
    setIsFilterSheetOpen,
    setShowFilter,
    showFilter,
    statusCounts,
    totalPages,
  } = useMenuManagement();

  if (isLoading) {
    return <MenuManagementLoadingState />;
  }

  if (isError) {
    return <MenuManagementErrorState onRetry={onRefetchMenus} />;
  }

  return (
    <div className="space-y-4 lg:flex lg:items-start lg:gap-4 lg:space-y-0">
      {showFilter ? (
        <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <MenuFilterBar
            categories={categories}
            filters={filters}
            statusCounts={statusCounts}
            onFiltersChange={onFilterChange}
            onReset={onFilterReset}
            onApply={onApplyFilters}
            className="lg:sticky lg:top-24"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="mb-4 rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-gray-900 sm:text-lg">
                  {filteredMenuCount} món đang hiển thị
                </p>
                {activeFilterCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {activeFilterCount} bộ lọc đang áp dụng
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-gray-500">
                {isFetching
                  ? isBranchMode
                    ? `Đang đồng bộ thực đơn của ${selectedBranchName}...`
                    : debouncedSearch
                      ? 'Đang tìm món từ hệ thống...'
                      : 'Đang đồng bộ dữ liệu thực đơn...'
                  : isBranchMode
                    ? canManageMenu
                      ? `Đang quản lý giá bán và trạng thái phục vụ tại ${selectedBranchName}.`
                      : `Đang xem giá bán và trạng thái phục vụ tại ${selectedBranchName}.`
                    : canManageMenu
                      ? 'Quản lý món ăn, danh mục và topping của hệ thống.'
                      : 'Xem danh sách món ăn, danh mục và topping hiện có.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 lg:hidden sm:w-auto">
                    <SlidersHorizontal className="h-4 w-4" />
                    Bộ lọc
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[calc(100vw-1rem)] max-w-sm overflow-y-auto border-r bg-white px-4 py-6 sm:px-5"
                >
                  <SheetHeader className="pr-8">
                    <SheetTitle>Bộ lọc thực đơn</SheetTitle>
                  </SheetHeader>

                  <MenuFilterBar
                    categories={categories}
                    filters={filters}
                    statusCounts={statusCounts}
                    onFiltersChange={onFilterChange}
                    onReset={onFilterReset}
                    onApply={onApplyFilters}
                    className="mt-5 border-none p-0 shadow-none"
                  />
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                onClick={() => setShowFilter(!showFilter)}
                className="hidden gap-2 lg:inline-flex"
              >
                {showFilter ? (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    Ẩn bộ lọc
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="h-4 w-4" />
                    Hiện bộ lọc
                  </>
                )}
              </Button>

              {canManageMenu ? (
                <>
                  <CategoryManagementDialog
                    categories={categoryManagementItems}
                    isLoading={isCategoryLoading}
                    isError={isCategoryError}
                    isFetching={isCategoryFetching}
                    nextDisplayOrder={nextCategoryDisplayOrder}
                    triggerClassName="w-full sm:w-auto"
                    onRetry={onRefetchCategories}
                  />
                  <AddonManagementDialog
                    addons={rawAddons}
                    isLoading={isAddonLoading}
                    isError={isAddonError}
                    isFetching={isAddonFetching}
                    triggerClassName="w-full sm:w-auto"
                    onRetry={onRetryAddons}
                  />
                  <AddMenuDialog
                    categories={categoryManagementItems}
                    triggerClassName="w-full sm:w-auto"
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>

       

        {paginatedMenus.length === 0 ? (
          <div className="flex min-h-[18rem] items-center justify-center rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-card sm:min-h-[20rem]">
            <div className="text-center">
              <p className="font-medium text-text-secondary">Không tìm thấy món ăn nào</p>
              <p className="mt-1 text-sm text-text-secondary">
                {canManageMenu
                  ? 'Thử điều chỉnh bộ lọc hoặc thêm món mới'
                  : 'Thử điều chỉnh bộ lọc để xem thêm món phù hợp'}
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
                  canManageMenu={canManageMenu}
                  onEdit={onEditMenu}
                  onDelete={onDeleteMenu}
                  onToggle={onToggleMenu}
                  onConfigureBranch={isBranchMode && canManageMenu ? onConfigureBranchMenu : undefined}
                  isBranchMode={isBranchMode}
                  isBranchLoading={isBranchMode && (isBranchConfigLoading || isBranchConfigFetching)}
                />
              ))}
            </MenuCardGrid>

            <div className="mt-6">
              <MenuPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredMenuCount}
                pageSize={12}
                onPageChange={onPageChange}
              />
            </div>
          </>
        )}
      </div>

      {canManageMenu ? (
        <>
          <AddMenuDialog
            categories={categoryManagementItems}
            menu={editingMenu}
            open={Boolean(editingMenu)}
            triggerClassName="w-full sm:w-auto"
            onOpenChange={onUpdateEditingMenuOpen}
          />
          <BranchMenuConfigDialog
            open={Boolean(configuringBranchMenu)}
            menu={configuringBranchMenu}
            branchName={selectedBranchName}
            isPending={isUpdatingBranchMenuItem}
            onSubmit={onSubmitBranchConfig}
            onOpenChange={onUpdateBranchConfigOpen}
          />
        </>
      ) : null}
    </div>
  );
};
