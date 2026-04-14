import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Package, 
  ArrowRight, 
  Loader2, 
  RefreshCcw 
} from 'lucide-react';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderStatus } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface StatusTab {
  id: OrderStatus | 'ALL';
  label: string;
  color: string;
}

const STATUS_TABS: StatusTab[] = [
  { id: 'ALL', label: 'Tất cả', color: 'bg-slate-100 text-slate-600' },
  { id: 'PENDING', label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-600' },
  { id: 'PROCESSING', label: 'Đang làm', color: 'bg-blue-100 text-blue-600' },
  { id: 'COMPLETED', label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'CANCELLED', label: 'Đã hủy', color: 'bg-rose-100 text-rose-600' },
];

const OrderManagementPage: React.FC = () => {
  const { orders, fetchOrders, isLoading, updateOrderStatus } = useOrderStore();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFetch = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);
    try {
      await fetchOrders();
    } catch {
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchStatus = activeTab === 'ALL' || order.status === activeTab;
      const matchSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.tableName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-amber-100 text-amber-600 border-none hover:bg-amber-100">Chờ xử lý</div>;
      case 'PROCESSING': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-100 text-blue-600 border-none hover:bg-blue-100">Đang làm</div>;
      case 'COMPLETED': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-emerald-100 text-emerald-600 border-none hover:bg-emerald-100">Hoàn tất</div>;
      case 'CANCELLED': return <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-rose-100 text-rose-600 border-none hover:bg-rose-100">Đã hủy</div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 overflow-hidden p-2">
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý đơn hàng</h1>
              <p className="text-slate-500 text-sm mt-1">Theo dõi và cập nhật trạng thái đơn hàng thời gian thực</p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleFetch(true)}
              disabled={isLoading || isRefreshing}
              className="rounded-2xl w-12 h-12 hover:bg-white hover:shadow-sm"
            >
              <RefreshCcw className={`w-5 h-5 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                placeholder="Tìm mã đơn hoặc tên bàn..." 
                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-orange-500 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-orange-500 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {(isLoading && !isRefreshing) ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
              <p className="font-bold animate-pulse">Đang tải danh sách...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 bg-white rounded-[32px] border border-slate-100">
              <RefreshCcw className="w-12 h-12 opacity-20" />
              <p className="text-lg font-medium">{error}</p>
              <Button onClick={() => handleFetch(true)} variant="outline" className="rounded-xl">Thử lại</Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 bg-white rounded-[32px] border border-dashed border-slate-200">
              <Package className="w-20 h-20 opacity-10" />
              <p className="text-lg font-medium">Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map(order => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-5 rounded-[32px] border transition-all cursor-pointer group ${
                      selectedOrderId === order.id 
                        ? 'bg-white border-orange-500 shadow-xl shadow-orange-500/5' 
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{order.orderNumber}</span>
                        <h3 className="text-lg font-black text-slate-800">{order.tableName || 'Mang đi'}</h3>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-4 py-4 border-y border-slate-50">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {i+1}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-500">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {order.items.length} sản phẩm
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          {format(new Date(order.createdAt), 'HH:mm', { locale: vi })}
                        </span>
                      </div>
                      <div className="font-black text-slate-800">
                        {order.totalAmount.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <aside className="w-[400px] bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedOrder ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <ChevronRight className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Chọn một đơn hàng</h2>
              <p className="text-slate-400">Xem thông tin chi tiết và cập nhật trạng thái đơn hàng tại đây</p>
            </motion.div>
          ) : (
            <motion.div 
              key={selectedOrder.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800">{selectedOrder.tableName || 'Mang đi'}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{selectedOrder.orderNumber}</p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</span>
                    <span className="text-sm font-black text-slate-700">
                      {format(new Date(selectedOrder.createdAt), 'HH:mm - dd/MM', { locale: vi })}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nguồn</span>
                    <span className="text-sm font-black text-slate-700">{selectedOrder.source}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Món đã đặt</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-slate-800">{item.itemName}</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {item.totalPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      {item.notes && (
                        <div className="ml-9 p-2 bg-orange-50 rounded-xl text-xs text-orange-600 font-medium">
                          Ghi chú: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedOrder.notes && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Ghi chú đơn hàng</h4>
                    <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 italic">
                      "{selectedOrder.notes}"
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-end mb-2 px-1">
                  <span className="text-slate-500 font-medium">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-orange-500">
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {selectedOrder.status === 'PENDING' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'PROCESSING')}
                      className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-base font-bold text-white shadow-lg shadow-blue-100"
                    >
                      <ArrowRight className="mr-2 w-5 h-5" />
                      Xác nhận & Chế biến
                    </Button>
                  )}
                  {selectedOrder.status === 'PROCESSING' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'COMPLETED')}
                      className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-base font-bold text-white shadow-lg shadow-emerald-100"
                    >
                      <CheckCircle2 className="mr-2 w-5 h-5" />
                      Hoàn tất đơn hàng
                    </Button>
                  )}
                  {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const reason = window.prompt('Lý do hủy đơn?');
                        if (reason) updateOrderStatus(selectedOrder.id, 'CANCELLED');
                      }}
                      className="h-12 rounded-2xl border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 font-bold"
                    >
                      <XCircle className="mr-2 w-4 h-4" />
                      Hủy đơn hàng
                    </Button>
                  )}
                  {(selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'CANCELLED') && (
                    <div className="p-4 bg-white rounded-2xl border border-dotted border-slate-300 text-center text-slate-400 text-sm font-medium">
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
