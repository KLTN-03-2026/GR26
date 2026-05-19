import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import type { SupplierOrder } from '../../types/supplier.types';

interface CancelPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SupplierOrder | null;
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * Dialog xác nhận hủy đơn mua hàng nhà cung cấp.
 */
export const CancelPurchaseOrderDialog = ({
  open,
  onOpenChange,
  order,
  isPending = false,
  onConfirm,
}: CancelPurchaseOrderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hủy đơn mua hàng</DialogTitle>
          <DialogDescription>
            {order ? (
              <>
                Bạn có chắc chắn muốn hủy đơn mua hàng{' '}
                <span className="font-semibold text-text-primary">{order.orderNumber}</span> không?
              </>
            ) : (
              'Chọn đơn mua hàng cần hủy.'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Đóng
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!order || isPending}>
            {isPending ? 'Đang hủy...' : 'Hủy đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
