import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { formatVND } from '@shared/utils/formatCurrency';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminInvoice, MarkInvoicePaidPayload } from '../types/adminBilling.types';

interface MarkInvoicePaidDialogProps {
  invoice: AdminInvoice | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: MarkInvoicePaidPayload) => void;
}

/**
 * Dialog xác nhận hóa đơn đã thanh toán.
 */
export const MarkInvoicePaidDialog = ({
  invoice,
  isPending,
  onOpenChange,
  onSubmit,
}: MarkInvoicePaidDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={onOpenChange}>
      <DialogContent className="border-admin-gray-200">
        <DialogHeader>
          <DialogTitle className="text-admin-gray-900">Xác nhận thanh toán</DialogTitle>
          <DialogDescription>
            Hóa đơn sẽ chuyển sang PAID và backend tự gia hạn subscription.
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

        <div className="space-y-2">
          <label htmlFor="payment-method" className="text-sm font-medium text-admin-gray-900">
            Phương thức thanh toán
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="h-10 w-full rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
          >
            <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
            <option value="CASH">Tiền mặt</option>
            <option value="MOMO">MoMo</option>
            <option value="ZALOPAY">ZaloPay</option>
          </select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-admin-success hover:bg-admin-success/90"
            onClick={() => onSubmit({ paymentMethod })}
            disabled={isPending || !invoice}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Xác nhận đã trả
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
