import { useState } from 'react';
import type { MenuCategoryInfo } from '@modules/menu/types/menu.types';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog';
import { CategoryCreateForm } from './CategoryCreateForm';
import { CategoryList } from './CategoryList';

interface CategoryManagementDialogProps {
  categories: MenuCategoryInfo[];
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  nextDisplayOrder: number;
  onRetry: () => void;
  triggerClassName?: string;
}

/**
 * Dialog quản lý danh mục trong trang thực đơn.
 */
export const CategoryManagementDialog = ({
  categories,
  isLoading,
  isError,
  isFetching = false,
  nextDisplayOrder,
  onRetry,
  triggerClassName,
}: CategoryManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryInfo | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setEditingCategory(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className={cn('gap-2', triggerClassName)}>
          Quản lý danh mục
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] border-0 w-[calc(100vw-1rem)] max-w-7xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-amber-100 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle className="text-lg text-gray-900 sm:text-xl">Quản lý danh mục</DialogTitle>
          <DialogDescription>
            Tạo mới, chỉnh sửa, vô hiệu hóa hoặc xóa danh mục trực tiếp trong cùng một khu vực quản lý.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-4 pb-4 pt-2 sm:gap-6 sm:px-6 sm:pb-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div
            className={cn(
              'rounded-3xl border p-4 sm:p-5',
              editingCategory
                ? 'border-sky-200 bg-sky-50/70'
                : 'border-amber-100 bg-amber-50/50'
            )}
          >
            <CategoryCreateForm
              nextDisplayOrder={nextDisplayOrder}
              editingCategory={editingCategory}
              onCancelEdit={() => setEditingCategory(null)}
            />
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-4 sm:p-5">
            <CategoryList
              categories={categories}
              isLoading={isLoading}
              isError={isError}
              isFetching={isFetching}
              onRetry={onRetry}
              onEditCategory={setEditingCategory}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
