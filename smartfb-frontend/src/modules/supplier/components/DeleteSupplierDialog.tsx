import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import type { Supplier } from '../types/supplier.types';

interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * Dialog xác nhận xóa nhà cung cấp.
 * Dùng dialog React để thao tác xóa có thể kiểm thử và chụp UI ổn định.
 */
export const DeleteSupplierDialog = ({
  open,
  onOpenChange,
  supplier,
  isPending,
  onConfirm,
}: DeleteSupplierDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Xóa nhà cung cấp</DialogTitle>
          </div>
          <DialogDescription className="pt-2 leading-6">
            {supplier ? (
              <>
                Bạn có chắc chắn muốn xóa nhà cung cấp{' '}
                <span className="font-semibold text-text-primary">{supplier.name}</span> không?
              </>
            ) : (
              'Nhà cung cấp sẽ bị xóa khỏi danh sách hiện tại.'
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Đang xóa...' : 'Xóa nhà cung cấp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
