import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Loader2, Package } from 'lucide-react';
import type { OrderResponse } from '@modules/order/types/order.types';
import { cn } from '@shared/utils/cn';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatOrderTime } from './orderManagement.utils';

interface OrderManagementListProps {
  orders: OrderResponse[];
  isLoading: boolean;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
}

export const OrderManagementList = ({
  orders,
  isLoading,
  selectedOrderId,
  onSelectOrder,
}: OrderManagementListProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-slate-100 bg-white text-slate-400">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="font-bold">Đang tải danh sách...</p>
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
        {orders.map((order) => (
          <motion.button
            layout
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            className={cn(
              'rounded-[32px] border bg-white p-5 text-left transition-all',
              selectedOrderId === order.id
                ? 'border-orange-500 shadow-xl shadow-orange-500/5'
                : 'border-slate-100 hover:border-slate-300'
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
              <div className="flex -space-x-2">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500"
                  >
                    {item.quantity}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-[10px] font-bold text-orange-500">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-slate-600">
                {order.items.length} sản phẩm
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">{formatOrderTime(order.createdAt)}</span>
              </div>

              <div className="text-right font-black text-slate-800">
                {order.totalAmount.toLocaleString('vi-VN')} ₫
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
