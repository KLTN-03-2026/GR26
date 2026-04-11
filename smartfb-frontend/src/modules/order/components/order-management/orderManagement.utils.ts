import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { OrderListItemResponse, OrderStatus } from '@modules/order/types/order.types';

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

/**
 * Đơn còn mở là đơn chưa kết thúc và có thể tiếp tục xử lý ở màn POS.
 */
export const isOrderOpenable = (status: OrderStatus): boolean => {
  return status !== 'COMPLETED' && status !== 'CANCELLED';
};

interface BuildOrderPageSearchParamsOptions {
  orderId?: string;
  tableId?: string | null;
  tableName?: string | null;
  freshTakeaway?: boolean;
}

/**
 * Chuẩn hóa query params cho màn POS order để có thể khôi phục lại đúng đơn/bàn sau điều hướng.
 */
export const buildOrderPageSearchParams = ({
  orderId,
  tableId,
  tableName,
  freshTakeaway = false,
}: BuildOrderPageSearchParamsOptions): string => {
  const searchParams = new URLSearchParams();

  if (orderId?.trim()) {
    searchParams.set('orderId', orderId.trim());
  }

  if (tableId?.trim()) {
    searchParams.set('tableId', tableId.trim());
  }

  if (tableName?.trim()) {
    searchParams.set('tableName', tableName.trim());
  }

  if (freshTakeaway) {
    searchParams.set('freshTakeaway', 'true');
  }

  return searchParams.toString();
};

export const getOrderSummaryCards = (orders: OrderListItemResponse[]) => {
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
