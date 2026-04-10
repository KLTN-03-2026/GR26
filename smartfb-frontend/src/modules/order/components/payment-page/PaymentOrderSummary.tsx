import { ArrowLeft } from 'lucide-react';
import type { OrderDraftItem, OrderTableContext } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { formatDateTime } from '@shared/utils/formatDate';
import { formatVND } from '@shared/utils/formatCurrency';

interface PaymentOrderSummaryProps {
  cart: OrderDraftItem[];
  tableContext: OrderTableContext | null;
  orderNumber: string | null;
  createdAt: string | null;
  onBack: () => void;
}

export const PaymentOrderSummary = ({
  cart,
  tableContext,
  orderNumber,
  createdAt,
  onBack,
}: PaymentOrderSummaryProps) => {
  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBack}
            className="rounded-full border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <p className="text-sm font-medium text-slate-400">Thanh toán</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Xác nhận giao dịch tại quầy
            </h1>
          </div>
        </div>

        <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-500">
          {orderNumber || 'Đơn POS'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] bg-slate-50 p-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Bàn</p>
          <p className="mt-2 text-xl font-black text-slate-900">
            {tableContext?.tableName || 'Mang đi'}
          </p>
        </div>
        <div className="rounded-[24px] bg-slate-50 p-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Chi nhánh</p>
          <p className="mt-2 text-xl font-black text-slate-900">
            {tableContext?.branchName || 'Chi nhánh hiện tại'}
          </p>
        </div>
        <div className="rounded-[24px] bg-slate-50 p-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Thời gian tạo</p>
          <p className="mt-2 text-xl font-black text-slate-900">
            {formatDateTime(createdAt ?? new Date().toISOString())}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Danh sách món</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kiểm tra lại món và ghi chú trước khi hoàn tất thanh toán.
          </p>
        </div>

        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.draftItemId}
              className="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4"
            >
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-200">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-lg font-black text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} x {formatVND(item.unitPrice)}
                </p>
                {Array.isArray(item.addons) && item.addons.length > 0 && (
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {item.addons.map((addon) => `${addon.addonName} x${addon.quantity}`).join(', ')}
                  </p>
                )}
                {item.notes && (
                  <p className="mt-1 line-clamp-1 text-xs italic text-orange-500">{item.notes}</p>
                )}
              </div>

              <p className="text-lg font-black text-slate-900">{formatVND(item.lineTotal)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
