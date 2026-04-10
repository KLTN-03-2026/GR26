import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import type { OrderResponse, OrderStatus } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatOrderTime } from './orderManagement.utils';

interface OrderManagementDetailPanelProps {
  selectedOrder: OrderResponse | null;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
}

export const OrderManagementDetailPanel = ({
  selectedOrder,
  onUpdateStatus,
  onCancelOrder,
}: OrderManagementDetailPanelProps) => {
  return (
    <aside className="flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm xl:sticky xl:top-0 xl:max-h-[calc(100vh-9rem)]">
      <AnimatePresence mode="wait">
        {!selectedOrder ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
          >
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <ChevronRight className="h-8 w-8 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Chọn một đơn hàng</h2>
            <p className="text-slate-400">
              Xem thông tin chi tiết và cập nhật trạng thái đơn hàng tại đây.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={selectedOrder.id}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex h-full flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-black text-slate-800">
                  {selectedOrder.tableName || 'Mang đi'}
                </h2>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  {selectedOrder.orderNumber}
                </p>
              </div>
              <OrderStatusBadge status={selectedOrder.status} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Thời gian
                    </span>
                    <span className="text-sm font-black text-slate-700">
                      {formatOrderTime(selectedOrder.createdAt, 'HH:mm - dd/MM')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Nguồn
                    </span>
                    <span className="text-sm font-black text-slate-700">{selectedOrder.source}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="px-1 text-sm font-bold uppercase tracking-[0.24em] text-slate-400">
                    Món đã đặt
                  </h4>

                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <span className="truncate font-bold text-slate-800">{item.itemName}</span>
                        </div>

                        <span className="shrink-0 font-bold text-slate-900">
                          {item.totalPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      {item.notes && (
                        <div className="ml-9 rounded-xl bg-orange-50 p-2 text-xs font-medium text-orange-600">
                          Ghi chú: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedOrder.notes && (
                  <div className="flex flex-col gap-2">
                    <h4 className="px-1 text-sm font-bold uppercase tracking-[0.24em] text-slate-400">
                      Ghi chú đơn hàng
                    </h4>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm italic text-slate-600">
                      "{selectedOrder.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 p-6">
              <div className="mb-2 flex items-end justify-between gap-4 px-1">
                <span className="font-medium text-slate-500">Tổng thanh toán</span>
                <span className="text-right text-2xl font-black text-orange-500">
                  {selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    onClick={() => onUpdateStatus(selectedOrder.id, 'PROCESSING')}
                    className="h-14 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Xác nhận & Chế biến
                  </Button>
                )}

                {selectedOrder.status === 'PROCESSING' && (
                  <Button
                    onClick={() => onUpdateStatus(selectedOrder.id, 'COMPLETED')}
                    className="h-14 rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Hoàn tất đơn hàng
                  </Button>
                )}

                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    onClick={() => onCancelOrder(selectedOrder.id)}
                    className="h-12 rounded-2xl border-slate-200 font-bold text-slate-500 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hủy đơn hàng
                  </Button>
                )}

                {(selectedOrder.status === 'COMPLETED' ||
                  selectedOrder.status === 'CANCELLED') && (
                  <div className="rounded-2xl border border-dotted border-slate-300 bg-white p-4 text-center text-sm font-medium text-slate-400">
                    Đơn hàng đã kết thúc
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
