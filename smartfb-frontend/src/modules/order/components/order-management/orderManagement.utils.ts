import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { OrderResponse, OrderStatus } from '@modules/order/types/order.types';

interface StatusTab {
  id: OrderStatus | 'ALL';
  label: string;
  color: string;
}

export const STATUS_TABS: StatusTab[] = [
  { id: 'ALL', label: 'Tất cả', color: 'bg-slate-100 text-slate-600' },
  { id: 'PENDING', label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-600' },
  { id: 'PROCESSING', label: 'Đang làm', color: 'bg-blue-100 text-blue-600' },
  { id: 'COMPLETED', label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'CANCELLED', label: 'Đã hủy', color: 'bg-rose-100 text-rose-600' },
];

export const resolveOrderCreatedAt = (createdAt?: string): Date => {
  return createdAt ? new Date(createdAt) : new Date();
};

export const formatOrderTime = (createdAt?: string, formatString = 'HH:mm') => {
  return format(resolveOrderCreatedAt(createdAt), formatString, { locale: vi });
};

export const getOrderSummaryCards = (orders: OrderResponse[]) => {
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
};
