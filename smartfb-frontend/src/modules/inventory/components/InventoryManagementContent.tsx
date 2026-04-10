import { InventoryActionDialog } from '@modules/inventory/components/InventoryActionDialog';
import { InventorySummaryCards } from '@modules/inventory/components/InventorySummaryCards';
import { InventoryTable } from '@modules/inventory/components/InventoryTable';
import { InventoryToolbar } from '@modules/inventory/components/InventoryToolbar';
import { useInventoryManagement } from '@modules/inventory/hooks/useInventoryManagement';
import { Button } from '@shared/components/ui/button';

/**
 * Thành phần chính của màn quản lý kho.
 * Page chỉ đóng vai trò route entry và không giữ business logic của module.
 */
export const InventoryManagementContent = () => {
  const {
    actionHint,
    branchOptions,
    canAdjust,
    canFilterByBranch,
    canImport,
    canWaste,
    currentPage,
    filteredBalances,
    filters,
    isActionLocked,
    isAdjustDialogOpen,
    isAdjusting,
    isError,
    isImportDialogOpen,
    isImporting,
    isLoading,
    isRecordingWaste,
    isSelectingBranch,
    isWasteDialogOpen,
    itemOptions,
    lowStockCount,
    onAdjustSubmit,
    onImportSubmit,
    onOpenAdjust,
    onOpenImport,
    onOpenWaste,
    onPageChange,
    onRefetch,
    onSearchChange,
    onSelectAdjustDialogOpen,
    onSelectImportDialogOpen,
    onSelectWasteDialogOpen,
    onSetBranchFilter,
    onSetLowStockFilter,
    onWasteSubmit,
    pageSize,
    paginatedBalances,
    resolveBranchName,
    selectedBranchName,
    selectedItemId,
    totalItems,
    totalPages,
    visibleBranchCount,
  } = useInventoryManagement();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="mb-3 text-lg font-semibold text-red-700">Không thể tải dữ liệu kho</p>
        <p className="mb-4 text-sm text-red-600">
          Kiểm tra quyền truy cập hoặc kết nối backend rồi thử tải lại dữ liệu tồn kho.
        </p>
        <Button onClick={onRefetch}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <InventorySummaryCards
        totalItems={totalItems}
        lowStockCount={lowStockCount}
        visibleBranchCount={visibleBranchCount}
      />

      {/* <div className="rounded-card border border-border bg-gradient-to-r from-primary-light/80 to-amber-50 px-5 py-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Context thao tác kho</p>
            <p className="text-base font-semibold text-text-primary">
              {selectedBranchName
                ? `Chi nhánh đang thao tác: ${selectedBranchName}`
                : 'Bạn đang ở chế độ xem toàn tenant'}
            </p>
            <p className="text-sm text-text-secondary">
              Danh sách tồn kho luôn hiển thị theo bộ lọc bên dưới. Các thao tác nhập kho, điều chỉnh và hao hụt
              sẽ áp dụng cho chi nhánh đang làm việc trên thanh bên.
            </p>
          </div>
          {isFetching ? <p className="text-sm text-text-secondary">Đang đồng bộ lại dữ liệu kho...</p> : null}
        </div>
      </div> */}

      <InventoryToolbar
        search={filters.search}
        branchId={filters.branchId}
        lowStockOnly={filters.lowStockOnly}
        branchOptions={branchOptions}
        canFilterByBranch={canFilterByBranch}
        canImport={canImport}
        canAdjust={canAdjust}
        canWaste={canWaste}
        isActionLocked={isActionLocked}
        isSwitchingBranch={isSelectingBranch}
        actionHint={actionHint}
        onSearchChange={onSearchChange}
        onBranchChange={onSetBranchFilter}
        onLowStockChange={(value) => {
          onSetLowStockFilter(value === 'low-stock');
        }}
        onOpenImport={() => {
          void onOpenImport();
        }}
        onOpenAdjust={() => {
          void onOpenAdjust();
        }}
        onOpenWaste={() => {
          void onOpenWaste();
        }}
      />

      <InventoryTable
        balances={paginatedBalances}
        totalItems={filteredBalances.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        canAdjust={canAdjust}
        canWaste={canWaste}
        isActionPending={isSelectingBranch}
        onPageChange={onPageChange}
        onAdjustItem={(itemId, branchId) => {
          void onOpenAdjust(itemId, branchId);
        }}
        onWasteItem={(itemId, branchId) => {
          void onOpenWaste(itemId, branchId);
        }}
        resolveBranchName={resolveBranchName}
      />

      <InventoryActionDialog
        mode="import"
        open={isImportDialogOpen}
        onOpenChange={onSelectImportDialogOpen}
        itemOptions={itemOptions}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isImporting}
        onImportSubmit={onImportSubmit}
      />

      <InventoryActionDialog
        mode="adjust"
        open={isAdjustDialogOpen}
        onOpenChange={onSelectAdjustDialogOpen}
        itemOptions={itemOptions}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isAdjusting}
        onAdjustSubmit={onAdjustSubmit}
      />

      <InventoryActionDialog
        mode="waste"
        open={isWasteDialogOpen}
        onOpenChange={onSelectWasteDialogOpen}
        itemOptions={itemOptions}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isRecordingWaste}
        onWasteSubmit={onWasteSubmit}
      />
    </div>
  );
};
