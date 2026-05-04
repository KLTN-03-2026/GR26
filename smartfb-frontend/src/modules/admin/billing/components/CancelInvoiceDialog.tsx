import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Textarea } from '@shared/components/ui/textarea';
import { formatVND } from '@shared/utils/formatCurrency';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminInvoice, CancelInvoicePayload } from '../types/adminBilling.types';

interface CancelInvoiceDialogProps {
  invoice: AdminInvoice | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CancelInvoicePayload) => void;
}

/**
 * Dialog hủy hóa đơn chưa thanh toán.
 */
export const CancelInvoiceDialog = ({
  invoice,
  isPending,
  onOpenChange,
  onSubmit,
}: CancelInvoiceDialogProps) => {
  const [reason, setReason] = useState('Khách hàng yêu cầu hủy hoặc tạo hóa đơn mới');

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={onOpenChange}>
      <DialogContent className="border-admin-gray-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-admin-gray-900">Hủy hóa đơn</DialogTitle>
          <DialogDescription>
            Chỉ hóa đơn UNPAID mới được hủy. Lý do hủy sẽ được lưu vào ghi chú hóa đơn.
          </DialogDescription>
        </DialogHeader>

        {invoice ? (
          <div className="rounded-lg bg-admin-gray-50 p-4">
            <p className="font-semibold text-admin-gray-900">{invoice.invoiceNumber}</p>
            <p className="mt-1 text-sm text-admin-gray-500">
              {invoice.tenantName} · {formatVND(invoice.amount)}
            </p>
          </div>
        ) : null}

        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Nhập lý do hủy hóa đơn"
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Quay lại
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onSubmit({ reason: reason.trim() || 'Admin hủy hóa đơn' })}
            disabled={isPending || !invoice}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
