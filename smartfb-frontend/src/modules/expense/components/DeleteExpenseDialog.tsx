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
import { formatVND } from '@shared/utils/formatCurrency';
import type { ExpenseItem } from '../types/expense.types';

interface DeleteExpenseDialogProps {
  open: boolean;
  onOpenChange: () => void;
  expense: ExpenseItem | null;
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * Dialog xác nhận xóa mềm phiếu chi.
 */
export const DeleteExpenseDialog = ({
  open,
  onOpenChange,
  expense,
  isPending,
  onConfirm,
}: DeleteExpenseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onOpenChange() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Xóa phiếu chi</DialogTitle>
          </div>
          <DialogDescription className="pt-2 leading-6">
            {expense ? (
              <>
                Bạn có chắc chắn muốn xóa phiếu chi{' '}
                <span className="font-semibold text-text-primary">{expense.categoryName}</span> với số tiền{' '}
                <span className="font-semibold text-text-primary">{formatVND(expense.amount)}</span>?
              </>
            ) : (
              'Phiếu chi sẽ được xóa mềm khỏi danh sách đang hiển thị.'
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onOpenChange} disabled={isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Đang xóa...' : 'Xóa phiếu chi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
