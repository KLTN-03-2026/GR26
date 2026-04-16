import { AlertCircle, PencilLine, Plus, Trash2 } from 'lucide-react';

import type { RecipeLine } from '@modules/recipe/types/recipe.types';
import type { RecipeLineInsight } from '@modules/recipe/utils';
import {
  formatRecipeCoverageCount,
  formatRecipeNumber,
} from '@modules/recipe/utils';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { cn } from '@shared/utils/cn';

interface RecipeLinesTableSectionProps {
  selectedItemName?: string;
  recipeInsights: RecipeLineInsight[];
  canManageRecipe: boolean;
  isIngredientsError: boolean;
  isIngredientsLoading: boolean;
  isRecipeLoading: boolean;
  isRecipeError: boolean;
  isUpdatingRecipe: boolean;
  isDeletingRecipe: boolean;
  createIngredientOptionCount: number;
  onRetryRecipe: () => void;
  onCreateFirstLine: () => void;
  onEditLine: (line: RecipeLine) => void;
  onDeleteLine: (line: RecipeLine) => void;
}

const RECIPE_STOCK_STATUS_CLASSNAME: Record<
  RecipeLineInsight['stockStatus'],
  string
> = {
  enough: 'bg-emerald-100 text-emerald-700',
  low: 'bg-rose-100 text-rose-700',
  unknown: 'bg-slate-100 text-slate-600',
};

const RECIPE_COMPONENT_TYPE_CLASSNAME: Record<RecipeLineInsight['ingredientType'], string> = {
  INGREDIENT: 'bg-blue-100 text-blue-700',
  SUB_ASSEMBLY: 'bg-violet-100 text-violet-700',
  UNKNOWN: 'bg-slate-100 text-slate-600',
};

export const RecipeLinesTableSection = ({
  selectedItemName,
  recipeInsights,
  canManageRecipe,
  isIngredientsError,
  isIngredientsLoading,
  isRecipeLoading,
  isRecipeError,
  isUpdatingRecipe,
  isDeletingRecipe,
  createIngredientOptionCount,
  onRetryRecipe,
  onCreateFirstLine,
  onEditLine,
  onDeleteLine,
}: RecipeLinesTableSectionProps) => {
  return (
    <>
      {isIngredientsError ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Không thể đồng bộ danh sách thành phần từ kho. Bạn vẫn xem được
            công thức hiện có, nhưng dữ liệu tồn tham chiếu có thể chưa đầy đủ.
          </p>
        </div>
      ) : null}

      {isRecipeLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-white">
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900">
              Đang tải công thức của item đã chọn
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Hệ thống đang gọi API lấy công thức của item đã chọn.
            </p>
          </div>
        </div>
      ) : isRecipeError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-red-700">
            Không thể tải công thức item đích
          </p>
          <p className="mt-2 text-sm text-red-600">
            Kiểm tra backend recipe hoặc dữ liệu item đang chọn rồi thử lại.
          </p>
          <Button className="mt-4" onClick={onRetryRecipe}>
            Thử lại
          </Button>
        </div>
      ) : recipeInsights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Item này chưa có công thức
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Bắt đầu thêm thành phần để hệ thống có thể dùng recipe cho các
            luồng quản trị kho, bán hàng và sản xuất.
          </p>
          {canManageRecipe ? (
            <Button
              className="mt-4"
              onClick={onCreateFirstLine}
              disabled={isIngredientsLoading || createIngredientOptionCount === 0}
            >
              <Plus className="h-4 w-4" />
              Tạo dòng công thức đầu tiên
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Bảng thành phần của {selectedItemName}
              </h2>
            </div>
          </div>

          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden w-[68px] md:table-cell">
                  STT
                </TableHead>
                <TableHead>Thành phần</TableHead>
                <TableHead>Định lượng</TableHead>
                <TableHead className="hidden md:table-cell">
                  Tồn tham chiếu
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Mức đáp ứng
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Trạng thái
                </TableHead>
                {canManageRecipe ? (
                  <TableHead className="w-[92px] text-right md:w-[180px]">
                    Thao tác
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipeInsights.map((line, index) => (
                <TableRow key={line.id}>
                  <TableCell className="hidden font-medium text-slate-500 md:table-cell">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-900">
                      {line.ingredientName}
                    </p>
                    <span
                      className={cn(
                        'mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                        RECIPE_COMPONENT_TYPE_CLASSNAME[line.ingredientType]
                      )}
                    >
                      {line.ingredientTypeLabel}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatRecipeNumber(line.quantity)} {line.displayUnit}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {line.availableQuantity === null
                      ? 'Chưa có dữ liệu'
                      : `${formatRecipeNumber(line.availableQuantity)} ${line.displayUnit}`}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {line.coverageCount === null
                      ? 'Chưa tính được'
                      : `${formatRecipeCoverageCount(line.coverageCount)} lượt tạo`}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-2.5 py-1 text-xs font-medium',
                        RECIPE_STOCK_STATUS_CLASSNAME[line.stockStatus]
                      )}
                    >
                      {line.stockStatusLabel}
                    </span>
                  </TableCell>
                  {canManageRecipe ? (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditLine(line)}
                          disabled={isUpdatingRecipe || isDeletingRecipe}
                          aria-label={`Sửa thành phần ${line.ingredientName}`}
                          title="Sửa"
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => onDeleteLine(line)}
                          disabled={isUpdatingRecipe || isDeletingRecipe}
                          aria-label={`Xóa thành phần ${line.ingredientName}`}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};
