import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowUpRight, Clock, Loader2, Package } from 'lucide-react';
import type { OrderListItemResponse } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatOrderTime, resolveOrderNavigationTarget } from './orderManagement.utils';

interface OrderManagementListProps {
  orders: OrderListItemResponse[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  onOpenOrder: (order: OrderListItemResponse) => void;
  onRetry?: () => void;
}

export const OrderManagementList = ({
  orders,
  isLoading,
  isError = false,
  errorMessage,
  onOpenOrder,
  onRetry,
}: OrderManagementListProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-slate-100 bg-white text-slate-400">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="font-bold">Đang tải danh sách...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-rose-100 bg-white px-6 text-center text-rose-500">
        <AlertCircle className="h-14 w-14" />
        <div className="space-y-1">
          <p className="text-lg font-black">Không thể tải danh sách đơn hàng</p>
          <p className="text-sm font-medium text-slate-500">
            {errorMessage ?? 'Vui lòng thử tải lại sau vài giây.'}
          </p>
        </div>
        {onRetry ? (
          <Button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600"
          >
            Tải lại
          </Button>
        ) : null}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-slate-200 bg-white text-slate-400">
        <Package className="h-20 w-20 opacity-10" />
        <p className="text-lg font-medium">Không tìm thấy đơn hàng nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
      <AnimatePresence mode="popLayout">
        {orders.map((order) => {
          const navigationTarget = resolveOrderNavigationTarget(order.status);
          const opensAtPos = navigationTarget === 'pos';

          return (
            <motion.button
              layout
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key={order.id}
              onClick={() => onOpenOrder(order)}
              className={cn(
                'cursor-pointer rounded-[32px] border bg-white p-5 text-left transition-all hover:-translate-y-0.5',
                'border-slate-100 hover:border-slate-300',
                opensAtPos ? 'hover:border-orange-300' : 'hover:border-slate-300'
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    {order.orderNumber}
                  </span>
                  <h3 className="truncate text-lg font-black text-slate-800">
                    {order.tableName || 'Mang đi'}
                  </h3>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex items-center gap-4 border-y border-slate-100 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold uppercase text-slate-500">
                  {order.tableName ? 'Bàn' : 'POS'}
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {order.staffName || 'Chưa có thông tin nhân viên'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">{formatOrderTime(order.createdAt)}</span>
                  </div>

                  <div
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-bold',
                      opensAtPos ? 'text-orange-500' : 'text-slate-500'
                    )}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {opensAtPos ? 'Mở lại tại POS' : 'Xem chi tiết đơn'}
                  </div>
                </div>

                <div className="text-right font-black text-slate-800">
                  {order.totalAmount.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
