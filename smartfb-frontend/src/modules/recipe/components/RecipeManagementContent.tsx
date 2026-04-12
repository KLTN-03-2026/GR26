import { useMemo, useState } from 'react';

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
} from '@modules/recipe/types/recipe.types';
import {
  buildRecipeFormulaSummary,
  buildRecipeInsights,
} from '@modules/recipe/utils';
import { Button } from '@shared/components/ui/button';
import { PERMISSIONS } from '@shared/constants/permissions';
import { usePermission } from '@shared/hooks/usePermission';

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
    setSearchKeyword,
    setSelectedCategoryId,
    setSelectedItemId,
    totalMenuItems,
  } = useRecipeManagement();
  const canManageRecipe = can(PERMISSIONS.MENU_EDIT);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<RecipeLine | null>(null);

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

    await onCreateRecipe({
      targetItemId: selectedItem.id,
      ingredientItemId: values.ingredientItemId,
      quantity: Number(values.quantity),
      unit: values.unit,
    });

    setIsCreateDialogOpen(false);
  };

  const handleEditSubmit = async (values: RecipeLineFormValues) => {
    if (!editingLine) {
      return;
    }

    await onUpdateRecipe(editingLine.id, {
      quantity: Number(values.quantity),
      unit: values.unit,
    });

    setEditingLine(null);
  };

  const handleDeleteRecipe = async (line: RecipeLine) => {
    const shouldDelete = window.confirm(
      `Bạn có chắc muốn xóa nguyên liệu ${line.ingredientName} khỏi công thức hiện tại không?`,
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
            Đang tải danh sách món bán
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Hệ thống đang đồng bộ dữ liệu công thức từ backend.
          </p>
        </div>
      </div>
    );
  }

  if (isMenuItemsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-red-700">
          Không thể tải danh sách món bán
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
          Chưa có món bán để cấu hình công thức
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Hãy tạo món trong thực đơn trước, sau đó quay lại màn công thức để
          thêm định lượng nguyên liệu.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <RecipeMenuSidebar
          searchKeyword={searchKeyword}
          debouncedSearchKeyword={debouncedSearchKeyword}
          selectedCategoryId={selectedCategoryId}
          selectedItemId={selectedItemId}
          categoryOptions={categoryOptions}
          menuItems={menuItems}
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
                Chưa có món phù hợp với bộ lọc hiện tại
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
          <RecipeLineDialog
            key={`recipe-create-${selectedItemId}`}
            open={isCreateDialogOpen}
            mode="create"
            targetItemName={selectedItem?.name ?? "món đã chọn"}
            ingredientOptions={createIngredientOptions}
            isPending={isCreatingRecipe}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreateSubmit}
          />

          <RecipeLineDialog
            key={`recipe-edit-${editingLine?.id ?? "empty"}`}
            open={Boolean(editingLine)}
            mode="edit"
            targetItemName={selectedItem?.name ?? "món đã chọn"}
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
