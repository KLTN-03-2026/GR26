import { useMemo, useState } from 'react';
import { Boxes, ChefHat } from 'lucide-react';

import { RecipeLineDialog } from '@modules/recipe/components/RecipeLineDialog';
import {
  RecipeFormulaOverview,
  RecipeLinesTableSection,
  RecipeMenuSidebar,
} from '@modules/recipe/components/recipe-management';
import { useRecipeManagement } from '@modules/recipe/hooks';
import type {
  RecipeLine,
  RecipeLineFormValues,
  RecipeTargetItemType,
} from '@modules/recipe/types/recipe.types';
import { RECIPE_TARGET_TYPE_LABELS } from '@modules/recipe/types/recipe.types';
import {
  buildRecipeFormulaSummary,
  buildRecipeInsights,
} from '@modules/recipe/utils';
import { Button } from '@shared/components/ui/button';
import { PERMISSIONS } from '@shared/constants/permissions';
import { usePermission } from '@shared/hooks/usePermission';
import { Tabs, TabsList, TabsTrigger } from '@shared/components/ui/tabs';

const RECIPE_TARGET_TYPE_OPTIONS: Array<{
  type: RecipeTargetItemType;
  icon: typeof ChefHat;
}> = [
  {
    type: 'SELLABLE',
    icon: ChefHat,
  },
  {
    type: 'SUB_ASSEMBLY',
    icon: Boxes,
  },
];

/**
 * Thành phần chính của màn quản lý công thức.
 */
export const RecipeManagementContent = () => {
  const { can } = usePermission();
  const {
    categoryOptions,
    debouncedSearchKeyword,
    getSelectableIngredients,
    hasMoreMenuItems,
    isCategoriesError,
    isCreatingRecipe,
    isDeletingRecipe,
    isIngredientsError,
    isIngredientsLoading,
    isIngredientsRefreshing,
    isLoadingMoreMenuItems,
    isMenuItemsError,
    isMenuItemsLoading,
    isRecipeError,
    isRecipeLoading,
    isRecipeRefreshing,
    isUpdatingRecipe,
    menuItems,
    onCreateRecipe,
    onDeleteRecipe,
    onLoadMoreMenuItems,
    onRefetchIngredients,
    onRefetchMenuItems,
    onRefetchRecipe,
    onUpdateRecipe,
    recipeLines,
    searchKeyword,
    selectedCategoryId,
    selectedItem,
    selectedItemId,
    targetItemType,
    setSearchKeyword,
    setSelectedCategoryId,
    setSelectedItemId,
    setTargetItemType,
    totalMenuItems,
  } = useRecipeManagement();
  const canManageRecipe = can(PERMISSIONS.MENU_EDIT);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<RecipeLine | null>(null);
  const selectedTargetTypeLabel = RECIPE_TARGET_TYPE_LABELS[targetItemType];
  const canFilterByCategory = targetItemType === 'SELLABLE';

  /**
   * Với thao tác tạo mới, loại bỏ các nguyên liệu đã nằm trong công thức hiện tại.
   */
  const createIngredientOptions = useMemo(() => {
    return getSelectableIngredients();
  }, [getSelectableIngredients]);

  /**
   * Khi sửa, vẫn phải giữ lại nguyên liệu hiện tại để người dùng nhìn thấy option đang dùng.
   */
  const editIngredientOptions = useMemo(() => {
    return getSelectableIngredients(editingLine?.ingredientItemId);
  }, [editingLine?.ingredientItemId, getSelectableIngredients]);

  /**
   * Enrich dữ liệu để bảng công thức đọc nhanh hơn mà không đổi API.
   */
  const recipeInsights = useMemo(() => {
    return buildRecipeInsights(recipeLines);
  }, [recipeLines]);

  const formulaSummary = useMemo(() => {
    return buildRecipeFormulaSummary(recipeInsights);
  }, [recipeInsights]);

  const hasVisibleMenuItems = menuItems.length > 0;

  const handleCreateSubmit = async (values: RecipeLineFormValues) => {
    if (!selectedItem) {
      return;
    }

    // FIX BUG: Author: HOÀNG | 16/04/2026
    // Truyền baseOutputQuantity và baseOutputUnit khi tạo recipe SUB_ASSEMBLY
    // để BE lưu sản lượng chuẩn, dùng cho tính scaleFactor khi ghi nhận mẻ sản xuất.
    const parsedBaseOutput = Number(values.baseOutputQuantity);
    await onCreateRecipe({
      targetItemId: selectedItem.id,
      ingredientItemId: values.ingredientItemId,
      quantity: Number(values.quantity),
      unit: values.unit,
      baseOutputQuantity:
        targetItemType === 'SUB_ASSEMBLY' && Number.isFinite(parsedBaseOutput) && parsedBaseOutput > 0
          ? parsedBaseOutput
          : undefined,
      baseOutputUnit:
        targetItemType === 'SUB_ASSEMBLY' && values.baseOutputUnit.trim()
          ? values.baseOutputUnit.trim()
          : undefined,
    });

    setIsCreateDialogOpen(false);
  };

  const handleEditSubmit = async (values: RecipeLineFormValues) => {
    if (!editingLine) {
      return;
    }

    // FIX BUG: Author: HOÀNG | 16/04/2026
    // Truyền baseOutputQuantity và baseOutputUnit khi sửa recipe SUB_ASSEMBLY
    // để user có thể sửa lại sản lượng chuẩn đã nhập sai trước đó.
    const parsedBaseOutput = Number(values.baseOutputQuantity);
    await onUpdateRecipe(editingLine.id, {
      quantity: Number(values.quantity),
      unit: values.unit,
      baseOutputQuantity:
        targetItemType === 'SUB_ASSEMBLY' && Number.isFinite(parsedBaseOutput) && parsedBaseOutput > 0
          ? parsedBaseOutput
          : undefined,
      baseOutputUnit:
        targetItemType === 'SUB_ASSEMBLY' && values.baseOutputUnit.trim()
          ? values.baseOutputUnit.trim()
          : undefined,
    });

    setEditingLine(null);
  };

  const handleDeleteRecipe = async (line: RecipeLine) => {
    const shouldDelete = window.confirm(
      `Bạn có chắc muốn xóa thành phần ${line.ingredientName} khỏi công thức hiện tại không?`,
    );

    if (!shouldDelete) {
      return;
    }

    await onDeleteRecipe(line.id);
  };

  if (isMenuItemsLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-white">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">
            Đang tải danh sách item đích
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Hệ thống đang đồng bộ dữ liệu công thức theo loại item đang chọn.
          </p>
        </div>
      </div>
    );
  }

  if (isMenuItemsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-red-700">
          Không thể tải danh sách item đích
        </p>
        <p className="mt-2 text-sm text-red-600">
          Kiểm tra quyền `MENU_VIEW` hoặc tình trạng backend rồi thử lại.
        </p>
        <Button className="mt-4" onClick={() => void onRefetchMenuItems()}>
          Tải lại dữ liệu
        </Button>
      </div>
    );
  }

  if (totalMenuItems === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-gray-900">
          Chưa có {targetItemType === 'SELLABLE' ? 'món bán' : 'bán thành phẩm'} để cấu hình công thức
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {targetItemType === 'SELLABLE'
            ? 'Hãy tạo món trong thực đơn trước, sau đó quay lại màn công thức để thêm thành phần.'
            : 'Hãy tạo bán thành phẩm trước, sau đó quay lại màn công thức để cấu hình định lượng.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý công thức</h1>
        </div>

        <Tabs value={targetItemType} onValueChange={(value) => setTargetItemType(value as RecipeTargetItemType)}>
          <TabsList>
            {RECIPE_TARGET_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <TabsTrigger key={option.type} value={option.type} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {RECIPE_TARGET_TYPE_LABELS[option.type]}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

  
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <RecipeMenuSidebar
          targetItemType={targetItemType}
          searchKeyword={searchKeyword}
          debouncedSearchKeyword={debouncedSearchKeyword}
          selectedCategoryId={selectedCategoryId}
          selectedItemId={selectedItemId}
          categoryOptions={categoryOptions}
          menuItems={menuItems}
          canFilterByCategory={canFilterByCategory}
          hasMoreMenuItems={hasMoreMenuItems}
          isCategoriesError={isCategoriesError}
          isLoadingMoreMenuItems={isLoadingMoreMenuItems}
          onSearchKeywordChange={setSearchKeyword}
          onCategoryChange={setSelectedCategoryId}
          onSelectItemId={setSelectedItemId}
          onLoadMoreMenuItems={() => void onLoadMoreMenuItems()}
        />

        <section className="space-y-4">
          {!hasVisibleMenuItems ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold text-slate-900">
                Chưa có {selectedTargetTypeLabel.toLowerCase()} phù hợp với bộ lọc hiện tại
              </p>
            </div>
          ) : (
            <>
              <RecipeFormulaOverview
                selectedItem={selectedItem}
                recipeInsightCount={recipeInsights.length}
                formulaSummary={formulaSummary}
                canManageRecipe={canManageRecipe}
                isIngredientsLoading={isIngredientsLoading}
                isIngredientsRefreshing={isIngredientsRefreshing}
                isRecipeRefreshing={isRecipeRefreshing}
                createIngredientOptionCount={createIngredientOptions.length}
                onRefetchRecipe={() => void onRefetchRecipe()}
                onRefetchIngredients={() => void onRefetchIngredients()}
                onCreateIngredient={() => setIsCreateDialogOpen(true)}
              />

              <RecipeLinesTableSection
                selectedItemName={selectedItem?.name}
                recipeInsights={recipeInsights}
                canManageRecipe={canManageRecipe}
                isIngredientsError={isIngredientsError}
                isIngredientsLoading={isIngredientsLoading}
                isRecipeLoading={isRecipeLoading}
                isRecipeError={isRecipeError}
                isUpdatingRecipe={isUpdatingRecipe}
                isDeletingRecipe={isDeletingRecipe}
                createIngredientOptionCount={createIngredientOptions.length}
                onRetryRecipe={() => void onRefetchRecipe()}
                onCreateFirstLine={() => setIsCreateDialogOpen(true)}
                onEditLine={setEditingLine}
                onDeleteLine={(line) => void handleDeleteRecipe(line)}
              />
            </>
          )}
        </section>
      </div>

      {canManageRecipe ? (
        <>
          {/* FIX BUG: Author: HOÀNG | 16/04/2026 — thêm targetItemType để dialog biết có hiện field sản lượng chuẩn không */}
          <RecipeLineDialog
            key={`recipe-create-${selectedItemId}`}
            open={isCreateDialogOpen}
            mode="create"
            targetItemName={selectedItem?.name ?? selectedTargetTypeLabel.toLowerCase()}
            targetItemType={targetItemType}
            ingredientOptions={createIngredientOptions}
            isPending={isCreatingRecipe}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreateSubmit}
          />

          <RecipeLineDialog
            key={`recipe-edit-${editingLine?.id ?? "empty"}`}
            open={Boolean(editingLine)}
            mode="edit"
            targetItemName={selectedItem?.name ?? selectedTargetTypeLabel.toLowerCase()}
            targetItemType={targetItemType}
            ingredientOptions={editIngredientOptions}
            initialLine={editingLine}
            isPending={isUpdatingRecipe}
            onOpenChange={(open) => {
              if (!open) {
                setEditingLine(null);
              }
            }}
            onSubmit={handleEditSubmit}
          />
        </>
      ) : null}
    </>
  );
};
