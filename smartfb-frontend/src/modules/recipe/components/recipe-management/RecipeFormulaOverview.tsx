import { Plus, RefreshCcw, Soup } from 'lucide-react';

import type { RecipeMenuItem } from '@modules/recipe/types/recipe.types';
import { RECIPE_TARGET_TYPE_LABELS } from '@modules/recipe/types/recipe.types';
import { formatRecipeNumber } from '@modules/recipe/utils';
import { Button } from '@shared/components/ui/button';

interface RecipeFormulaOverviewProps {
  selectedItem: RecipeMenuItem | null;
  recipeInsightCount: number;
  formulaSummary: string;
  canManageRecipe: boolean;
  isIngredientsLoading: boolean;
  isIngredientsRefreshing: boolean;
  isRecipeRefreshing: boolean;
  createIngredientOptionCount: number;
  onRefetchRecipe: () => void;
  onRefetchIngredients: () => void;
  onCreateIngredient: () => void;
}

export const RecipeFormulaOverview = ({
  selectedItem,
  recipeInsightCount,
  formulaSummary,
  canManageRecipe,
  isIngredientsLoading,
  isIngredientsRefreshing,
  isRecipeRefreshing,
  createIngredientOptionCount,
  onRefetchRecipe,
  onRefetchIngredients,
  onCreateIngredient,
}: RecipeFormulaOverviewProps) => {
  const selectedItemTypeLabel = selectedItem
    ? RECIPE_TARGET_TYPE_LABELS[selectedItem.itemType]
    : 'Item đích';
  const unitLabel = selectedItem?.itemType === 'SUB_ASSEMBLY' ? 'Đơn vị đầu ra' : 'Đơn vị bán';
  const priceLabel = selectedItem?.itemType === 'SUB_ASSEMBLY' ? 'Giá tham chiếu' : 'Giá bán';

  return (
    <div className="rounded-2xl border flex w-full justify-between border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="h-full w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 md:w-lg">
          <div className="h-fit space-y-3">
            <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Tên item đích</p>
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                  {selectedItemTypeLabel}
                </span>
              </div>
              <p className="mt-1 h-fit max-h-20 text-lg font-semibold text-slate-900">
                {selectedItem?.name}
              </p>
            </div>
            <div className="grid h-full gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="h-full rounded-xl border border-amber-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{priceLabel}</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatRecipeNumber(selectedItem?.basePrice ?? 0)} đ
                </p>
              </div>
              <div className="h-full rounded-xl border border-amber-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{unitLabel}</p>
                <p className="mt-1 h-full font-semibold text-slate-900">
                  {selectedItem?.unit || 'Chưa khai báo'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              onClick={onRefetchRecipe}
              disabled={!selectedItem || isRecipeRefreshing}
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại công thức
            </Button>
            <Button
              variant="outline"
              onClick={onRefetchIngredients}
              disabled={isIngredientsRefreshing}
            >
              <Soup className="h-4 w-4" />
              Đồng bộ thành phần
            </Button>
            {canManageRecipe ? (
              <Button
                onClick={onCreateIngredient}
                disabled={
                  !selectedItem ||
                  isIngredientsLoading ||
                  createIngredientOptionCount === 0
                }
              >
                <Plus className="h-4 w-4" />
                Thêm thành phần
              </Button>
            ) : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedItem?.name
                  ? `Công thức của ${selectedItem.name}`
                  : 'Công thức item'}
              </h2>
              <span className="inline-flex rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {recipeInsightCount} thành phần
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm leading-7 text-slate-700">
                <span className="font-semibold text-slate-900">
                  1 {selectedItem?.unit || 'phần'} {selectedItem?.name}
                </span>{' '}
                = {formulaSummary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
