import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useDeleteTable } from '../hooks/useDeleteTable';

interface DeleteTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableName: string;
  onSuccess?: () => void;
}

export const DeleteTableDialog = ({
  open,
  onOpenChange,
  tableId,
  tableName,
  onSuccess,
}: DeleteTableDialogProps) => {
  const { mutate: deleteTable, isPending, isError, error } = useDeleteTable();
  const errorMessage = isError && error instanceof Error ? error.message : '';

  useEffect(() => {
    if (!open) {
      return;
    }
  }, [open]);

  const handleDelete = async () => {
    deleteTable(tableId, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Xác nhận xóa bàn</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa bàn <strong>{tableName}</strong>? 
          </DialogDescription>
        </DialogHeader>

        {isError && (
          <p className="text-sm text-red-600 mt-2">{errorMessage || 'Xóa bàn không thành công'}</p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Đang xóa...' : 'Xóa bàn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};