import { Printer, ReceiptText } from 'lucide-react';
import type { OrderDraftItem, OrderTableContext } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { formatDateTime } from '@shared/utils/formatDate';
import { formatVND } from '@shared/utils/formatCurrency';

interface TemporaryInvoiceDialogProps {
  open: boolean;
  branchName: string;
  createdBy: string;
  orderNumber: string;
  createdAt: string;
  tableContext: OrderTableContext | null;
  cartItems: OrderDraftItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
}

/**
 * Preview hóa đơn tạm ngay trên FE trước khi chuyển qua bước thanh toán.
 * Header hóa đơn luôn lấy tên chi nhánh đang thao tác thay cho chữ SmartF&B.
 */
export const TemporaryInvoiceDialog = ({
  open,
  branchName,
  createdBy,
  orderNumber,
  createdAt,
  tableContext,
  cartItems,
  subtotal,
  vatAmount,
  totalAmount,
  onOpenChange,
  onPrint,
}: TemporaryInvoiceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] rounded-[32px] border-none bg-[#f7f1e9] p-6 shadow-2xl">
        <DialogTitle className="sr-only">Hóa đơn tạm</DialogTitle>
        <DialogDescription className="sr-only">
          Xem trước hóa đơn tạm trước khi in hoặc quay lại chỉnh đơn.
        </DialogDescription>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Xem trước in tạm</p>
              <p className="text-xl font-black text-slate-900">Hóa đơn tạm bàn</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[360px] rounded-[20px] bg-white p-5 shadow-lg">
            <div className="border-b border-dashed border-slate-200 pb-4 text-center">
              <p className="text-xl font-black uppercase tracking-wide text-orange-500">
                {branchName}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Hóa đơn tạm nội bộ, dùng để kiểm tra món trước khi thanh toán.
              </p>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-200 py-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-500">Số đơn</span>
                <span className="text-right font-semibold text-slate-900">{orderNumber}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-500">Bàn</span>
                <span className="text-right font-semibold text-slate-900">
                  {tableContext?.tableName || 'Mang đi'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-500">Khu vực</span>
                <span className="text-right font-semibold text-slate-900">
                  {tableContext?.zoneName || 'Chưa chọn'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-500">Nhân viên</span>
                <span className="text-right font-semibold text-slate-900">{createdBy}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-500">Thời gian</span>
                <span className="text-right font-semibold text-slate-900">
                  {formatDateTime(createdAt)}
                </span>
              </div>
            </div>

            <div className="space-y-4 border-b border-dashed border-slate-200 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_44px_88px] gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                <span>Món</span>
                <span className="text-center">SL</span>
                <span className="text-right">T.Tiền</span>
              </div>

              {cartItems.map((item) => (
                <div key={item.draftItemId} className="space-y-1.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_44px_88px] gap-2 text-sm">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span className="text-center text-slate-500">{item.quantity}</span>
                    <span className="text-right font-semibold text-slate-900">
                      {formatVND(item.lineTotal)}
                    </span>
                  </div>

                  {Array.isArray(item.addons) && item.addons.length > 0 && (
                    <p className="pl-2 text-xs italic text-slate-500">
                      +{' '}
                      {item.addons
                        .map((addon) => `${addon.addonName} x${addon.quantity}`)
                        .join(', ')}
                    </p>
                  )}

                  {item.notes && (
                    <p className="pl-2 text-xs italic text-amber-600">/ {item.notes}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 text-sm">
              <div className="flex justify-between gap-3 text-slate-500">
                <span>Tạm tính</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-3 text-slate-500">
                <span>VAT (8%)</span>
                <span>{formatVND(vatAmount)}</span>
              </div>
              <div className="flex justify-between gap-3 pt-1 text-base font-black text-slate-900">
                <span>Tổng cộng</span>
                <span className="text-orange-500">{formatVND(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 rounded-full border-slate-200 bg-white"
            >
              Quay lại đơn
            </Button>
            <Button
              type="button"
              onClick={onPrint}
              className="h-12 flex-1 rounded-full bg-orange-500 font-bold hover:bg-orange-600"
            >
              <Printer className="mr-2 h-4 w-4" />
              In ngay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
