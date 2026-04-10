import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useDeleteCategory } from "@modules/menu/hooks/useDeleteCategory";
import { useUpdateCategory } from "@modules/menu/hooks/useUpdateCategory";
import type { MenuCategoryInfo } from "@modules/menu/types/menu.types";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { cn } from "@shared/utils/cn";

interface CategoryListProps {
  categories: MenuCategoryInfo[];
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  onRetry: () => void;
  onEditCategory: (category: MenuCategoryInfo) => void;
}

/**
 * Danh sách danh mục thực đơn hiện có.
 */
export const CategoryList = ({
  categories,
  isLoading,
  isError,
  isFetching = false,
  onRetry,
  onEditCategory,
}: CategoryListProps) => {
  const [categoryToDelete, setCategoryToDelete] =
    useState<MenuCategoryInfo | null>(null);
  const { mutate: updateCategory, isPending: isUpdatingCategory } =
    useUpdateCategory();
  const { mutate: deleteCategory, isPending: isDeletingCategory } =
    useDeleteCategory();

  const sortedCategories = useMemo(() => {
    return [...categories].sort((left, right) => {
      const orderDiff =
        (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.displayOrder ?? Number.MAX_SAFE_INTEGER);

      if (orderDiff !== 0) {
        return orderDiff;
      }

      return left.name.localeCompare(right.name, "vi");
    });
  }, [categories]);

  const handleToggleCategoryStatus = (category: MenuCategoryInfo) => {
    updateCategory({
      id: category.id,
      currentCategory: category,
      payload: {
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder ?? 0,
        isActive: category.isActive === false,
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) {
      return;
    }

    deleteCategory(
      {
        id: categoryToDelete.id,
        name: categoryToDelete.name,
      },
      {
        onSuccess: () => {
          setCategoryToDelete(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))]">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`category-skeleton-${index}`}
            className="h-28 animate-pulse rounded-2xl bg-amber-50 sm:h-32"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/60 px-6 text-center">
        <p className="text-sm font-medium text-red-700">
          Không thể tải danh sách danh mục
        </p>
        <p className="mt-2 text-sm text-red-600">
          Hệ thống chưa lấy được dữ liệu danh mục từ backend. Bạn có thể thử tải
          lại.
        </p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Tải lại danh mục
        </Button>
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
        <p className="text-sm font-medium text-amber-900">
          Chưa có danh mục nào
        </p>
        <p className="mt-2 text-sm text-amber-700">
          Tạo danh mục đầu tiên để nhóm món ăn dễ quản lý hơn.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Danh sách danh mục
            </h3>
            <p className="text-sm text-gray-500">
              Đang có {sortedCategories.length} danh mục trong hệ thống.
            </p>
          </div>
          {isFetching ? (
            <span className="text-sm text-gray-500">Đang đồng bộ...</span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          {sortedCategories.map((category) => {
            const isInactive = category.isActive === false;
            const description = category.description?.trim() || "Chưa có mô tả";
            const countLabel = `${category.count ?? 0} món`;
            const orderLabel = `Ưu tiên #${category.displayOrder ?? 0}`;
            const cardToneClassName = isInactive
              ? "border-rose-200 bg-red-100"
              : "border-emerald-200 bg-green-100";
            const chipToneClassName = isInactive
              ? "ring-rose-100/90"
              : "ring-emerald-100/90";

            return (
              <article
                key={category.id}
                className={cn(
                  "flex min-h-40 flex-col rounded-2xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5",
                  cardToneClassName,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-600 ring-1",
                          chipToneClassName,
                        )}
                      >
                        {orderLabel}
                      </span>

                      <span
                        className={cn(
                          "inline-flex shrink-0 rounded-full bg-white/85 px-2 py-1 text-[10px] font-medium text-gray-600 ring-1",
                          chipToneClassName,
                        )}
                      >
                        {countLabel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p
                        className={cn(
                          "line-clamp-2 text-sm font-semibold sm:text-[15px]",
                          isInactive ? "text-gray-700" : "text-gray-900",
                        )}
                      >
                        {category.name}
                      </p>
                      <p className="line-clamp-3 text-[11px] leading-4 text-gray-500 sm:text-xs">
                        {description}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-xl text-gray-500 hover:bg-white/80"
                        disabled={isUpdatingCategory || isDeletingCategory}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onEditCategory(category);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          handleToggleCategoryStatus(category);
                        }}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {isInactive ? "Kích hoạt lại" : "Vô hiệu hóa"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700"
                        onSelect={(event) => {
                          event.preventDefault();
                          setCategoryToDelete(category);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa danh mục
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Dialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryToDelete(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Xóa danh mục
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {categoryToDelete
                ? `Bạn sắp xóa danh mục "${categoryToDelete.name}". Chỉ nên xóa khi danh mục này không còn dùng trong quy trình quản lý menu.`
                : "Xác nhận thao tác xóa danh mục."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:flex-row sm:justify-end sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryToDelete(null)}
              disabled={isDeletingCategory}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? "Đang xóa..." : "Xóa danh mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
