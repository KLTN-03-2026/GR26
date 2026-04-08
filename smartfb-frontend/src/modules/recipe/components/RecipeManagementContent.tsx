import { useMemo, useState } from "react";
import {
  AlertCircle,
  PencilLine,
  Plus,
  RefreshCcw,
  Search,
  Soup,
  Trash2,
} from "lucide-react";
import { useRecipeManagement } from "@modules/recipe/hooks/useRecipeManagement";
import type {
  RecipeLine,
  RecipeLineFormValues,
} from "@modules/recipe/types/recipe.types";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { cn } from "@shared/utils/cn";
import { RecipeLineDialog } from "./RecipeLineDialog";

interface RecipeLineInsight extends RecipeLine {
  coverageCount: number | null;
  displayUnit: string;
  stockStatus: "enough" | "low" | "unknown";
  stockStatusLabel: string;
}

const NUMBER_FORMATTER = new Intl.NumberFormat("vi-VN");

const DECIMAL_FORMATTER = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

/**
 * Thành phần chính của màn quản lý công thức.
 */
export const RecipeManagementContent = () => {
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
  const recipeInsights = useMemo<RecipeLineInsight[]>(() => {
    return recipeLines.map((line) => {
      const displayUnit = line.unit || "đơn vị";
      const coverageCount =
        line.availableQuantity !== null && line.quantity > 0
          ? line.availableQuantity / line.quantity
          : null;
      const stockStatus =
        line.availableQuantity === null
          ? "unknown"
          : line.availableQuantity >= line.quantity
            ? "enough"
            : "low";

      return {
        ...line,
        coverageCount,
        displayUnit,
        stockStatus,
        stockStatusLabel:
          stockStatus === "enough"
            ? "Đủ tồn"
            : stockStatus === "low"
              ? "Thiếu tồn"
              : "Chưa có tồn",
      };
    });
  }, [recipeLines]);

  const formulaSummary = useMemo(() => {
    if (recipeInsights.length === 0) {
      return "Món này chưa có công thức.";
    }

    return recipeInsights
      .map(
        (line) =>
          `${NUMBER_FORMATTER.format(line.quantity)} ${line.displayUnit} ${line.ingredientName}`,
      )
      .join(" + ");
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
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">
            Danh sách món
          </h2>

          <div className="grid gap-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="recipe-search"
              >
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="recipe-search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  className="pl-9"
                  placeholder="Ví dụ: Bạc xỉu, Trà đào..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Danh mục</p>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCategoriesError ? (
                <p className="text-xs text-amber-700">
                  Không tải được danh mục. Hệ thống đang giữ bộ lọc mặc định.
                </p>
              ) : null}
            </div>
          </div>

          {debouncedSearchKeyword ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="mt-1 text-xs text-slate-500">
                Từ khóa: {debouncedSearchKeyword}
              </p>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_88px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <span>Tên món</span>
              <span className="text-right">Giá bán</span>
            </div>

            <div className="max-h-[38rem] overflow-y-auto">
              {menuItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  <p>Chưa có món phù hợp trong phần dữ liệu đã tải.</p>
                  {hasMoreMenuItems ? (
                    <p className="mt-1">
                      Bạn có thể bấm tải thêm để tìm tiếp theo danh mục đang
                      chọn.
                    </p>
                  ) : null}
                </div>
              ) : (
                menuItems.map((item) => {
                  const isSelected = item.id === selectedItemId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_88px] items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0",
                        isSelected
                          ? "bg-amber-50"
                          : "bg-white hover:bg-slate-50",
                      )}
                    >
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-right text-xs font-medium text-slate-600">
                        {NUMBER_FORMATTER.format(item.basePrice)} đ
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => void onLoadMoreMenuItems()}
            disabled={!hasMoreMenuItems || isLoadingMoreMenuItems}
            className="w-full"
          >
            {isLoadingMoreMenuItems
              ? "Đang tải thêm món..."
              : hasMoreMenuItems
                ? "Tải thêm 10 món"
                : "Đã tải hết món"}
          </Button>
        </aside>

        <section className="space-y-4">
          {!hasVisibleMenuItems ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold text-slate-900">
                Chưa có món phù hợp với bộ lọc hiện tại
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border flex w-full justify-between border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start w-full lg:justify-between">
                  {/* <div className=""> */}
                  <div className="rounded-2xl border w-full md:w-lg h-full border-amber-200 bg-amber-50 p-4">
                    <div className="space-y-3 h-fit">
                      <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
                        <p className="text-xs text-slate-500">Tên món</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900 h-fit max-h-20">
                          {selectedItem?.name}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 h-full">
                        <div className="rounded-xl border border-amber-200 bg-white h-full px-4 py-3">
                          <p className="text-xs text-slate-500">Giá bán</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {NUMBER_FORMATTER.format(
                              selectedItem?.basePrice ?? 0,
                            )}{" "}
                            đ
                          </p>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-white h-full px-4 py-3">
                          <p className="text-xs text-slate-500">Đơn vị bán</p>
                          <p className="mt-1 font-semibold text-slate-900 h-full">
                            {selectedItem?.unit || "Chưa khai báo"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* </div> */}
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => void onRefetchRecipe()}
                        disabled={!selectedItem || isRecipeRefreshing}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Tải lại công thức
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void onRefetchIngredients()}
                        disabled={isIngredientsRefreshing}
                      >
                        <Soup className="h-4 w-4" />
                        Đồng bộ nguyên liệu
                      </Button>
                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        disabled={
                          !selectedItem ||
                          isIngredientsLoading ||
                          createIngredientOptions.length === 0
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Thêm nguyên liệu
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-slate-900">
                          {selectedItem?.name
                            ? `Công thức của ${selectedItem.name}`
                            : "Công thức món"}
                        </h2>
                        <span className="inline-flex rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          {recipeInsights.length} nguyên liệu
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm leading-7 text-slate-700">
                          <span className="font-semibold text-slate-900">
                            1 {selectedItem?.unit || "phần"}{" "}
                            {selectedItem?.name}
                          </span>{" "}
                          = {formulaSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isIngredientsError ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Không thể đồng bộ danh sách nguyên liệu từ kho. Bạn vẫn xem
                    được công thức hiện có, nhưng dữ liệu tồn tham chiếu có thể
                    chưa đầy đủ.
                  </p>
                </div>
              ) : null}

              {isRecipeLoading ? (
                <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-white">
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-900">
                      Đang tải công thức của món đã chọn
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Hệ thống đang gọi API lấy công thức của món đã chọn.
                    </p>
                  </div>
                </div>
              ) : isRecipeError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                  <p className="text-lg font-semibold text-red-700">
                    Không thể tải công thức món bán
                  </p>
                  <p className="mt-2 text-sm text-red-600">
                    Kiểm tra backend recipe hoặc dữ liệu món bán đang chọn rồi
                    thử lại.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => void onRefetchRecipe()}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : recipeInsights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-6 py-12 text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    Món này chưa có công thức
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Bắt đầu thêm nguyên liệu để hệ thống có thể dùng recipe cho
                    các luồng quản trị kho và bán hàng.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                    disabled={
                      isIngredientsLoading ||
                      createIngredientOptions.length === 0
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Tạo dòng công thức đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                        Bảng nguyên liệu của {selectedItem?.name}
                      </h2>
                    </div>
                  </div>

                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="hidden w-[68px] md:table-cell">
                          STT
                        </TableHead>
                        <TableHead>Nguyên liệu</TableHead>
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
                        <TableHead className="w-[92px] text-right md:w-[180px]">
                          Thao tác
                        </TableHead>
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
                          </TableCell>
                          <TableCell>
                            {NUMBER_FORMATTER.format(line.quantity)}{" "}
                            {line.displayUnit}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {line.availableQuantity === null
                              ? "Chưa có dữ liệu"
                              : `${NUMBER_FORMATTER.format(line.availableQuantity)} ${line.displayUnit}`}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {line.coverageCount === null
                              ? "Chưa tính được"
                              : `${DECIMAL_FORMATTER.format(line.coverageCount)} lượt pha`}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2.5 py-1 text-xs font-medium",
                                line.stockStatus === "enough" &&
                                  "bg-emerald-100 text-emerald-700",
                                line.stockStatus === "low" &&
                                  "bg-rose-100 text-rose-700",
                                line.stockStatus === "unknown" &&
                                  "bg-slate-100 text-slate-600",
                              )}
                            >
                              {line.stockStatusLabel}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditingLine(line)}
                                disabled={isUpdatingRecipe || isDeletingRecipe}
                                aria-label={`Sửa nguyên liệu ${line.ingredientName}`}
                                title="Sửa"
                              >
                                <PencilLine className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => void handleDeleteRecipe(line)}
                                disabled={isUpdatingRecipe || isDeletingRecipe}
                                aria-label={`Xóa nguyên liệu ${line.ingredientName}`}
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

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
  );
};
