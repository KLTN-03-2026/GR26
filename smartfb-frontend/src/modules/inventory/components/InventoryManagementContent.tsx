import { useState } from 'react';
import { Boxes, ClipboardCheck, Factory, FlaskConical, History, type LucideIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Button } from '@shared/components/ui/button';
import { InventoryActionDialog } from '@modules/inventory/components/InventoryActionDialog';
import { CreateSemiProductDialog } from '@modules/inventory/components/CreateSemiProductDialog';
import { DeleteIngredientDialog } from '@modules/inventory/components/DeleteIngredientDialog';
import { EditIngredientDialog } from '@modules/inventory/components/EditIngredientDialog';
import { InventoryIngredientCatalogTable } from '@modules/inventory/components/InventoryIngredientCatalogTable';
import { InventoryIngredientCatalogToolbar } from '@modules/inventory/components/InventoryIngredientCatalogToolbar';
import { InventorySummaryCards } from '@modules/inventory/components/InventorySummaryCards';
import { InventoryTable } from '@modules/inventory/components/InventoryTable';
import { InventoryToolbar } from '@modules/inventory/components/InventoryToolbar';
import { RecordProductionBatchDialog } from '@modules/inventory/components/RecordProductionBatchDialog';
import { ProductionBatchHistory } from '@modules/inventory/components/ProductionBatchHistory';
import { UpdateThresholdDialog } from '@modules/inventory/components/UpdateThresholdDialog';
import { InventoryTransactionHistory } from '@modules/inventory/components/InventoryTransactionHistory';
// import { InventoryStockCheck } from '@modules/inventory/components/InventoryStockCheck';
// Thiên: Thay thế InventoryStockCheck bằng InventoryCheckManagement
import { InventoryCheckManagement } from '@modules/inventory/components/InventoryCheck/InventoryCheckManagement';
import { CreateIngredientDialog } from '@modules/inventory/components/CreateIngredientDialog';
import { useInventoryIngredientCatalogView } from '@modules/inventory/hooks/useInventoryIngredientCatalogView';
import { useInventoryManagement } from '@modules/inventory/hooks/useInventoryManagement';
import { usePermission } from '@shared/hooks/usePermission';
import type { InventoryIngredientCatalogRow } from '@modules/inventory/types/inventory.types';

type InventoryTabValue =
  | 'ingredients'
  | 'ingredient-catalog'
  | 'semi-products'
  | 'production-history'
  | 'history'
  | 'stockcheck';

interface InventoryTabOption {
  value: InventoryTabValue;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
  visible: boolean;
}

/**
 * Thành phần chính của màn quản lý kho.
 * Bao gồm các luồng: tồn kho nguyên liệu, danh mục nguyên liệu, bán thành phẩm,
 * lịch sử giao dịch và kiểm kho.
 */
export const InventoryManagementContent = () => {
  const [isCreateIngredientOpen, setIsCreateIngredientOpen] = useState(false);
  const [isDeleteIngredientOpen, setIsDeleteIngredientOpen] = useState(false);
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false);
  const [isCreateSemiProductOpen, setIsCreateSemiProductOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<InventoryIngredientCatalogRow | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    'ingredients' | 'ingredient-catalog' | 'semi-products' | 'production-history' | 'history' | 'stockcheck'
  >(
    'ingredients',
  );
  const { can } = usePermission();
  const canManageCatalogItems = can('MENU_EDIT');
  const canViewIngredientCatalog = can('MENU_VIEW') || can('MENU_EDIT');
  const inventorySection = activeTab === 'semi-products' ? 'semi-products' : 'ingredients';
  const isSemiProductTab = inventorySection === 'semi-products';

  const {
    actionHint,
    branchOptions,
    canAdjust,
    canFilterByBranch,
    canImport,
    canRecordProduction,
    canWaste,
    currentPage,
    filteredBalances,
    filters,
    importItemOptions,
    isActionLocked,
    isAdjustDialogOpen,
    isAdjusting,
    isError,
    isImportDialogOpen,
    isImporting,
    isLoading,
    isProductionDialogOpen,
    isRecordingProduction,
    isRecordingWaste,
    isSelectingBranch,
    isThresholdDialogOpen,
    isUpdatingThreshold,
    isWasteDialogOpen,
    selectedThresholdBalance,
    lowStockCount,
    onAdjustSubmit,
    onImportSubmit,
    onOpenAdjust,
    onOpenImport,
    onOpenProduction,
    onOpenThreshold,
    onOpenWaste,
    onPageChange,
    onProductionSubmit,
    onRefetch,
    onSearchChange,
    onSelectAdjustDialogOpen,
    onSelectImportDialogOpen,
    onSelectProductionDialogOpen,
    onSelectThresholdDialogOpen,
    onSelectWasteDialogOpen,
    onSetBranchFilter,
    onSetLowStockFilter,
    onThresholdSubmit,
    onWasteSubmit,
    pageSize,
    paginatedBalances,
    resolveBranchName,
    selectedBranchName,
    selectedItemId,
    stockItemOptions,
    totalItems,
    totalPages,
    visibleBranchCount,
  } = useInventoryManagement(inventorySection);
  const {
    currentPage: ingredientCatalogCurrentPage,
    ingredientsWithoutStockCount,
    isError: isIngredientCatalogError,
    isLoading: isIngredientCatalogLoading,
    onPageChange: onIngredientCatalogPageChange,
    onRefetch: onRefetchIngredientCatalog,
    onSearchChange: onIngredientCatalogSearchChange,
    pageSize: ingredientCatalogPageSize,
    paginatedRows: paginatedIngredientCatalogRows,
    search: ingredientCatalogSearch,
    totalCatalogItems,
    totalFilteredItems: totalFilteredIngredientItems,
    totalPages: ingredientCatalogTotalPages,
  } = useInventoryIngredientCatalogView();

  const itemLabel = isSemiProductTab ? 'bán thành phẩm' : 'nguyên liệu';
  const itemType = isSemiProductTab ? 'SUB_ASSEMBLY' : 'INGREDIENT';
  const searchLabel = isSemiProductTab ? 'Tìm bán thành phẩm' : 'Tìm nguyên liệu';
  const searchPlaceholder = isSemiProductTab
    ? 'Tìm theo tên bán thành phẩm'
    : 'Tìm theo tên nguyên liệu';
  const createItemLabel = isSemiProductTab ? 'Thêm bán thành phẩm' : 'Thêm nguyên liệu';
  const importActionLabel = isSemiProductTab ? 'Nhập tồn' : 'Nhập kho';
  const inventoryTabOptions: InventoryTabOption[] = [
    {
      value: 'ingredients',
      label: 'Tồn kho nguyên liệu',
      mobileLabel: 'Tồn kho',
      icon: FlaskConical,
      visible: true,
    },
    {
      value: 'ingredient-catalog',
      label: 'Danh mục nguyên liệu',
      mobileLabel: 'Nguyên liệu',
      icon: FlaskConical,
      visible: canViewIngredientCatalog,
    },
    {
      value: 'semi-products',
      label: 'Bán thành phẩm',
      mobileLabel: 'Bán TP',
      icon: Boxes,
      visible: true,
    },
    {
      value: 'production-history',
      label: 'Lịch sử sản xuất',
      mobileLabel: 'Sản xuất',
      icon: Factory,
      visible: true,
    },
    {
      value: 'history',
      label: 'Lịch sử giao dịch',
      mobileLabel: 'Giao dịch',
      icon: History,
      visible: true,
    },
    {
      value: 'stockcheck',
      label: 'Kiểm kho',
      mobileLabel: 'Kiểm kho',
      icon: ClipboardCheck,
      visible: canAdjust,
    },
  ];

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
      {/* Thẻ tóm tắt tổng quan tồn kho */}
      <InventorySummaryCards
        totalItems={totalItems}
        lowStockCount={lowStockCount}
        visibleBranchCount={visibleBranchCount}
      />

      {/* Tabs chính */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        {/* Mobile + Tablet: dropdown select */}
        <div className="mb-4 lg:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {inventoryTabOptions
              .filter((tab) => tab.visible)
              .map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
          </select>
        </div>

        {/* Desktop: underline tabs */}
        <div className="mb-4 hidden border-b border-border lg:block">
          <TabsList className="flex h-auto gap-0 rounded-none border-0 bg-transparent p-0">
            {inventoryTabOptions
              .filter((tab) => tab.visible)
              .map((tab) => {
                const Icon = tab.icon;

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="-mb-px h-auto gap-2 rounded-t-md border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-text-secondary shadow-none transition-colors hover:bg-primary/5 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
          </TabsList>
        </div>

        <TabsContent value="ingredients" className="space-y-4">
          <InventoryToolbar
            search={filters.search}
            searchLabel={searchLabel}
            searchPlaceholder={searchPlaceholder}
            branchId={filters.branchId}
            lowStockOnly={filters.lowStockOnly}
            branchOptions={branchOptions}
            canFilterByBranch={canFilterByBranch}
            canImport={canImport}
            canAdjust={canAdjust}
            canWaste={canWaste}
            canCreateItem={canManageCatalogItems}
            createItemLabel={createItemLabel}
            importActionLabel={importActionLabel}
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
            onOpenCreateIngredient={() => setIsCreateIngredientOpen(true)}
          />

          <InventoryTable
            balances={paginatedBalances}
            itemLabel={itemLabel}
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
            onEditThreshold={canAdjust ? onOpenThreshold : undefined}
            resolveBranchName={resolveBranchName}
          />
        </TabsContent>

        {canViewIngredientCatalog ? (
          <TabsContent value="ingredient-catalog" className="space-y-4">
            {isIngredientCatalogError ? (
              <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
                <p className="mb-3 text-lg font-semibold text-red-700">
                  Không thể tải danh mục nguyên liệu
                </p>
                <p className="mb-4 text-sm text-red-600">
                  Kiểm tra quyền truy cập danh mục món hoặc kết nối backend rồi thử lại.
                </p>
                <Button onClick={() => void onRefetchIngredientCatalog()}>
                  Thử lại
                </Button>
              </div>
            ) : isIngredientCatalogLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="spinner spinner-md" />
              </div>
            ) : (
              <>
                <InventoryIngredientCatalogToolbar
                  search={ingredientCatalogSearch}
                  onSearchChange={onIngredientCatalogSearchChange}
                  canCreateItem={canManageCatalogItems}
                  onOpenCreateIngredient={() => setIsCreateIngredientOpen(true)}
                  totalCatalogItems={totalCatalogItems}
                  ingredientsWithoutStockCount={ingredientsWithoutStockCount}
                />

                <InventoryIngredientCatalogTable
                  canEditItem={canManageCatalogItems}
                  items={paginatedIngredientCatalogRows}
                  onDeleteItem={(item) => {
                    setEditingIngredient(item);
                    setIsDeleteIngredientOpen(true);
                  }}
                  onEditItem={(item) => {
                    setEditingIngredient(item);
                    setIsEditIngredientOpen(true);
                  }}
                  totalItems={totalFilteredIngredientItems}
                  currentPage={ingredientCatalogCurrentPage}
                  totalPages={ingredientCatalogTotalPages}
                  pageSize={ingredientCatalogPageSize}
                  onPageChange={onIngredientCatalogPageChange}
                />
              </>
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="semi-products" className="space-y-4">
          <InventoryToolbar
            search={filters.search}
            searchLabel={searchLabel}
            searchPlaceholder={searchPlaceholder}
            branchId={filters.branchId}
            lowStockOnly={filters.lowStockOnly}
            branchOptions={branchOptions}
            canFilterByBranch={canFilterByBranch}
            canImport={canImport}
            canAdjust={canAdjust}
            canWaste={canWaste}
            canRecordProduction={canRecordProduction}
            canCreateItem={canManageCatalogItems}
            createItemLabel={createItemLabel}
            importActionLabel={importActionLabel}
            productionActionLabel="Ghi nhận sản xuất"
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
            onOpenProduction={() => {
              void onOpenProduction();
            }}
            onOpenAdjust={() => {
              void onOpenAdjust();
            }}
            onOpenWaste={() => {
              void onOpenWaste();
            }}
            onOpenCreateIngredient={() => setIsCreateSemiProductOpen(true)}
          />

          <InventoryTable
            balances={paginatedBalances}
            itemLabel={itemLabel}
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
            onEditThreshold={canAdjust ? onOpenThreshold : undefined}
            resolveBranchName={resolveBranchName}
          />
        </TabsContent>

        {/* Tab lịch sử mẻ sản xuất bán thành phẩm */}
        <TabsContent value="production-history">
          <ProductionBatchHistory />
        </TabsContent>

        {/* Tab 3: Lịch sử giao dịch */}
        <TabsContent value="history">
          <InventoryTransactionHistory />
        </TabsContent>

        {/* Tab 4: Kiểm kho (chỉ owner/admin mới thấy) Thiên: Thay thế InventoryStockCheck bằng InventoryCheckManagement*/}
        {canAdjust && (
          <TabsContent value="stockcheck">
            {/* <InventoryStockCheck /> */}
            <InventoryCheckManagement />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs thao tác kho */}
      <InventoryActionDialog
        mode="import"
        open={isImportDialogOpen}
        onOpenChange={onSelectImportDialogOpen}
        itemOptions={importItemOptions}
        itemLabel={itemLabel}
        itemType={itemType}
        importActionLabel={importActionLabel}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isImporting}
        onImportSubmit={onImportSubmit}
      />

      <InventoryActionDialog
        mode="adjust"
        open={isAdjustDialogOpen}
        onOpenChange={onSelectAdjustDialogOpen}
        itemOptions={stockItemOptions}
        itemLabel={itemLabel}
        itemType={itemType}
        importActionLabel={importActionLabel}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isAdjusting}
        onAdjustSubmit={onAdjustSubmit}
      />

      <RecordProductionBatchDialog
        open={isProductionDialogOpen}
        onOpenChange={onSelectProductionDialogOpen}
        itemOptions={importItemOptions}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isRecordingProduction}
        onSubmit={onProductionSubmit}
      />

      <InventoryActionDialog
        mode="waste"
        open={isWasteDialogOpen}
        onOpenChange={onSelectWasteDialogOpen}
        itemOptions={stockItemOptions}
        itemLabel={itemLabel}
        itemType={itemType}
        importActionLabel={importActionLabel}
        selectedBranchName={selectedBranchName}
        defaultItemId={selectedItemId}
        isPending={isRecordingWaste}
        onWasteSubmit={onWasteSubmit}
      />

      <UpdateThresholdDialog
        open={isThresholdDialogOpen}
        onOpenChange={onSelectThresholdDialogOpen}
        itemName={selectedThresholdBalance?.itemName ?? null}
        unit={selectedThresholdBalance?.unit ?? null}
        currentMinLevel={selectedThresholdBalance?.minLevel ?? 0}
        isPending={isUpdatingThreshold}
        onSubmit={(minLevel) => {
          if (!selectedThresholdBalance) return;
          onThresholdSubmit({ balanceId: selectedThresholdBalance.id, minLevel });
        }}
      />

      {/* Dialog tạo nguyên liệu mới trong danh mục kho */}
      {canManageCatalogItems && (
        <CreateIngredientDialog
          open={isCreateIngredientOpen}
          onOpenChange={setIsCreateIngredientOpen}
        />
      )}

      {canManageCatalogItems && (
        <EditIngredientDialog
          ingredient={editingIngredient}
          open={isEditIngredientOpen}
          onOpenChange={(open) => {
            setIsEditIngredientOpen(open);

            if (!open) {
              setTimeout(() => setEditingIngredient(null), 300);
            }
          }}
        />
      )}

      {canManageCatalogItems && (
        <DeleteIngredientDialog
          ingredient={editingIngredient}
          open={isDeleteIngredientOpen}
          onOpenChange={(open) => {
            setIsDeleteIngredientOpen(open);

            if (!open) {
              setTimeout(() => setEditingIngredient(null), 300);
            }
          }}
        />
      )}

      {canManageCatalogItems && (
        <CreateSemiProductDialog
          open={isCreateSemiProductOpen}
          onOpenChange={setIsCreateSemiProductOpen}
        />
      )}
    </div>
  );
};
