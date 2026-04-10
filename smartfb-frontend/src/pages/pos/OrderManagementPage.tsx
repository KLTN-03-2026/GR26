import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  RefreshCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderStatus } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';

interface StatusTab {
  id: OrderStatus | 'ALL';
  label: string;
  color: string;
}

// Các tab tương ứng luồng xử lý đơn hàng mà nhân viên thường thao tác trong ca làm việc.
const STATUS_TABS: StatusTab[] = [
  { id: 'ALL', label: 'Tất cả', color: 'bg-slate-100 text-slate-600' },
  { id: 'PENDING', label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-600' },
  { id: 'PROCESSING', label: 'Đang làm', color: 'bg-blue-100 text-blue-600' },
  { id: 'COMPLETED', label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'CANCELLED', label: 'Đã hủy', color: 'bg-rose-100 text-rose-600' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang làm',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-600',
  PROCESSING: 'bg-blue-100 text-blue-600',
  COMPLETED: 'bg-emerald-100 text-emerald-600',
  CANCELLED: 'bg-rose-100 text-rose-600',
};

const OrderManagementPage = () => {
  const { orders, fetchOrders, isLoading, updateOrderStatus } = useOrderStore();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = activeTab === 'ALL' || order.status === activeTab;

      if (!normalizedSearchQuery) {
        return matchesStatus;
      }

      const orderNumber = order.orderNumber.toLowerCase();
      const tableName = (order.tableName ?? '').toLowerCase();

      return (
        matchesStatus &&
        (orderNumber.includes(normalizedSearchQuery) || tableName.includes(normalizedSearchQuery))
      );
    });
  }, [activeTab, normalizedSearchQuery, orders]);

  const selectedOrder = useMemo(() => {
    if (filteredOrders.length === 0) {
      return null;
    }

    if (!selectedOrderId) {
      return filteredOrders[0];
    }

    return filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0];
  }, [filteredOrders, selectedOrderId]);

  const summaryCards = useMemo(() => {
    const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
    const processingCount = orders.filter((order) => order.status === 'PROCESSING').length;

    return [
      {
        key: 'all',
        label: 'Tổng đơn đang có',
        value: orders.length,
        tone: 'bg-slate-900 text-white',
      },
      {
        key: 'pending',
        label: 'Đơn chờ xử lý',
        value: pendingCount,
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        key: 'processing',
        label: 'Đơn đang làm',
        value: processingCount,
        tone: 'bg-blue-50 text-blue-700',
      },
    ];
  }, [orders]);

  const handleCancelOrder = (orderId: string) => {
    const reason = window.prompt('Lý do hủy đơn?');

    if (!reason) {
      return;
    }

    void updateOrderStatus(orderId, 'CANCELLED');
  };

  const renderStatusBadge = (status: OrderStatus) => {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
          STATUS_BADGE_STYLES[status]
        )}
      >
        {STATUS_LABELS[status]}
      </div>
    );
  };

  return (
    <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <section className="flex min-h-0 min-w-0 flex-col gap-6">
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-800">
                  Quản lý đơn hàng
                </h1>
                <p className="text-sm text-slate-500">
                  Theo dõi trạng thái đơn theo thời gian thực và thao tác nhanh ngay tại quầy.
                </p>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => void fetchOrders()}
                disabled={isLoading}
                className="h-12 w-12 rounded-2xl border-slate-200"
              >
                <RefreshCcw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
              </Button>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm mã đơn hoặc tên bàn..."
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50 pl-12 text-base focus-visible:ring-orange-500"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 rounded-[24px] bg-slate-50 p-1.5">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors',
                      activeTab === tab.id
                        ? 'bg-white text-orange-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {summaryCards.map((card) => (
                <div
                  key={card.key}
                  className={cn('rounded-[24px] px-5 py-4', card.tone)}
                >
                  <p className="text-sm font-medium opacity-80">{card.label}</p>
                  <p className="mt-2 text-3xl font-black">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-slate-100 bg-white text-slate-400">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="font-bold">Đang tải danh sách...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-slate-200 bg-white text-slate-400">
              <Package className="h-20 w-20 opacity-10" />
              <p className="text-lg font-medium">Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <motion.button
                    layout
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      'rounded-[32px] border bg-white p-5 text-left transition-all',
                      selectedOrder?.id === order.id
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
                      {renderStatusBadge(order.status)}
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
                        <span className="text-xs font-medium">
                          {format(new Date(order.createdAt), 'HH:mm', { locale: vi })}
                        </span>
                      </div>

                      <div className="text-right font-black text-slate-800">
                        {order.totalAmount.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

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
                {renderStatusBadge(selectedOrder.status)}
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                        Thời gian
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {format(new Date(selectedOrder.createdAt), 'HH:mm - dd/MM', {
                          locale: vi,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                        Nguồn
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {selectedOrder.source}
                      </span>
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
                            <span className="truncate font-bold text-slate-800">
                              {item.itemName}
                            </span>
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
                      onClick={() => void updateOrderStatus(selectedOrder.id, 'PROCESSING')}
                      className="h-14 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
                    >
                      <ArrowRight className="mr-2 h-5 w-5" />
                      Xác nhận & Chế biến
                    </Button>
                  )}

                  {selectedOrder.status === 'PROCESSING' && (
                    <Button
                      onClick={() => void updateOrderStatus(selectedOrder.id, 'COMPLETED')}
                      className="h-14 rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Hoàn tất đơn hàng
                    </Button>
                  )}

                  {selectedOrder.status !== 'COMPLETED' &&
                    selectedOrder.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancelOrder(selectedOrder.id)}
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
    </div>
  );
};

export default OrderManagementPage;
