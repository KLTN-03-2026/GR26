import { Trash2 } from 'lucide-react';
import { useDeleteIngredient } from '@modules/inventory/hooks/useDeleteIngredient';
import type { InventoryIngredientCatalogRow } from '@modules/inventory/types/inventory.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';

interface DeleteIngredientDialogProps {
  ingredient: InventoryIngredientCatalogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog xác nhận xóa mềm nguyên liệu khỏi danh mục kho.
 */
export const DeleteIngredientDialog = ({
  ingredient,
  open,
  onOpenChange,
}: DeleteIngredientDialogProps) => {
  const { mutateAsync: deleteIngredient, isPending } = useDeleteIngredient();

  const handleDelete = async () => {
    if (!ingredient) {
      return;
    }

    await deleteIngredient({
      id: ingredient.itemId,
      name: ingredient.itemName,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Xóa nguyên liệu
          </DialogTitle>
          <DialogDescription>
            {ingredient ? (
              <>
                Bạn sắp xóa nguyên liệu <strong>{ingredient.itemName}</strong> khỏi danh mục kho.
                Thao tác này sẽ ẩn item khỏi các dropdown tạo mới, nhưng không xóa lịch sử phát
                sinh tồn kho trước đó.
              </>
            ) : (
              'Nguyên liệu được chọn sẽ bị xóa khỏi danh mục kho.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Hãy kiểm tra trước khi xóa nếu nguyên liệu này đang được dùng trong công thức hoặc đang có
          phát sinh nhập kho.
        </div>

        <DialogFooter className="gap-3 pt-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => void handleDelete()}
          >
            {isPending ? 'Đang xóa...' : 'Xóa nguyên liệu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
