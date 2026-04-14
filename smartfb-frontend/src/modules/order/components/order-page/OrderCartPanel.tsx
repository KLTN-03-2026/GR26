import {
  ChevronRight,
  Minus,
  PencilLine,
  Plus,
  PrinterCheck,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { OrderStatusBadge } from "@modules/order/components/order-management/OrderStatusBadge";
import type {
  OrderDraftItem,
  OrderStatus,
  OrderTableContext,
} from "@modules/order/types/order.types";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/utils/cn";
import { formatVND } from "@shared/utils/formatCurrency";
import { formatDateTime } from "@shared/utils/formatDate";
import { getCartItemSummary } from "./orderPage.utils";

interface OrderCartPanelProps {
  cart: OrderDraftItem[];
  tableContext: OrderTableContext | null;
  draftOrder: {
    orderNumber: string | null;
    createdAt: string | null;
    orderId: string | null;
    status: OrderStatus;
  };
  currentUserName: string;
  hasPlacedOrder: boolean;
  isSyncingDraft: boolean;
  isItemActionsDisabled?: boolean;
  totalItemCount: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  checkoutButtonLabel: string;
  isCheckoutDisabled?: boolean;
  onOpenInvoice: () => void;
  onCancelPlacedOrder: () => void;
  onEditCartItem: (draftItemId: string) => void;
  onDeleteCartItem: (item: OrderDraftItem) => void;
  onChangeItemQuantity: (item: OrderDraftItem, delta: number) => void;
  onCheckout: () => void;
  className?: string;
}

export const OrderCartPanel = ({
  cart,
  draftOrder,
  currentUserName,
  hasPlacedOrder,
  isSyncingDraft,
  isItemActionsDisabled = false,
  totalItemCount,
  subtotal,
  vatAmount,
  totalAmount,
  checkoutButtonLabel,
  isCheckoutDisabled = false,
  onOpenInvoice,
  onCancelPlacedOrder,
  onEditCartItem,
  onDeleteCartItem,
  onChangeItemQuantity,
  onCheckout,
  className,
}: OrderCartPanelProps) => {
  const createdAtLabel = draftOrder.createdAt
    ? formatDateTime(draftOrder.createdAt)
    : "";

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm xl:max-h-[calc(100vh-10rem)]",
        className,
      )}
    >
      <div className="space-y-5 border-b border-slate-100 bg-[linear-gradient(180deg,#fff9f4_0%,#ffffff_100%)] p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3"></div>

          <div className="flex justify-between items-center">
            <div className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Thu ngân
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
                {currentUserName}
              </p>
            </div>
            <div className="col-span-2 rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Thời gian
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {createdAtLabel}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenInvoice}
              className="h-11 rounded-full border-orange-200 px-4 text-orange-600 hover:bg-orange-50"
            >
              <PrinterCheck className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3 pt-4 text-sm text-slate-500">
          <div>
            <p className="font-bold text-slate-800">Danh sách món đã chọn</p>
            <p className="mt-1 text-xs text-slate-400">
              {totalItemCount} món / {cart.length} dòng món
            </p>
          </div>
    
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-center">
              <div>
                <ReceiptText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-base font-bold text-slate-700">
                  Chưa có món trong đơn
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn món từ danh sách bên trái để bắt đầu.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.draftItemId}
                  className="rounded-[24px] border border-[#efe2d5] bg-white p-4 shadow-[0_14px_30px_rgba(191,144,101,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => onEditCartItem(item.draftItemId)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="line-clamp-1 text-[1.08rem] font-black leading-6 tracking-tight text-slate-900">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-400">
                            {formatVND(item.unitPrice)} / món
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {getCartItemSummary(item)}
                          </p>
                        </button>

                        <div className="flex shrink-0 flex-col items-end gap-3">
                          <p className="text-[1.08rem] font-black tracking-tight text-slate-900">
                            {formatVND(item.lineTotal)}
                          </p>
                          <button
                            type="button"
                            onClick={() => onDeleteCartItem(item)}
                            disabled={isItemActionsDisabled}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#ff5f4a] transition-colors hover:bg-[#fff1ee]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 rounded-full border border-[#eadbce] bg-[#fcf7f2] px-3 py-1.5">
                          <button
                            type="button"
                            onClick={() => onChangeItemQuantity(item, -1)}
                            disabled={isItemActionsDisabled}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#f3e8df] hover:text-slate-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-6 text-center text-[1rem] font-black text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onChangeItemQuantity(item, 1)}
                            disabled={isItemActionsDisabled}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#f3e8df] hover:text-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onEditCartItem(item.draftItemId)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                        >
                          <PencilLine className="h-4 w-4" />
                
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5 border-t border-slate-100 p-5">
        <div className="space-y-4 text-sm">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span>Tạm tính</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-slate-500">
              <span>VAT (8%)</span>
              <span>{formatVND(vatAmount)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-2xl font-black text-slate-900">
              <span>Tổng cộng</span>
              <span className="text-orange-500">{formatVND(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {hasPlacedOrder && (
            <Button
              type="button"
              variant="outline"
              disabled={isSyncingDraft}
              onClick={onCancelPlacedOrder}
              className="h-12 flex-1 rounded-full border-rose-200 text-rose-500 hover:bg-rose-50"
            >
              Hủy đơn đã tạo
            </Button>
          )}
          <Button
            type="button"
            disabled={cart.length === 0 || isSyncingDraft || isCheckoutDisabled}
            onClick={onCheckout}
            className="h-12 flex-1 rounded-full bg-orange-500 font-bold hover:bg-orange-600"
          >
            {checkoutButtonLabel}
            {!isSyncingDraft && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
};
