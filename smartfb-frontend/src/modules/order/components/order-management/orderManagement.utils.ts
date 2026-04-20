import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { OrderListItemResponse, OrderStatus } from '@modules/order/types/order.types';

interface OrderDateRangeFilter {
  fromDate: string;
  toDate: string;
}

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

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toOrderFilterInstant = (
  dateValue: string,
  boundary: 'start' | 'end'
): string | undefined => {
  if (!DATE_INPUT_PATTERN.test(dateValue)) {
    return undefined;
  }

  const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';
  const date = new Date(`${dateValue}T${time}`);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/**
 * Chuyển ngày từ input `YYYY-MM-DD` sang Instant ISO để backend lọc `createdAt`.
 */
export const buildOrderDateRangeParams = ({ fromDate, toDate }: OrderDateRangeFilter) => {
  return {
    from: toOrderFilterInstant(fromDate, 'start'),
    to: toOrderFilterInstant(toDate, 'end'),
  };
};

/**
 * Điều hướng của card order tại màn quản lý.
 * Đơn đang mở quay về POS để xử lý tiếp, đơn đã đóng chuyển sang trang xem chi tiết.
 */
export const resolveOrderNavigationTarget = (
  status: OrderStatus
): 'pos' | 'detail' => {
  return status === 'PENDING' || status === 'PROCESSING' ? 'pos' : 'detail';
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

export const getOrderSummaryCards = (
  orders: OrderListItemResponse[],
  totalElements = orders.length
) => {
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  const processingCount = orders.filter((order) => order.status === 'PROCESSING').length;

  return [
    {
      key: 'all',
      label: 'Tổng đơn phù hợp',
      value: totalElements,
      tone: 'bg-slate-900 text-white',
    },
    {
      key: 'pending',
      label: 'Chờ xử lý trong trang',
      value: pendingCount,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'processing',
      label: 'Đang làm trong trang',
      value: processingCount,
      tone: 'bg-blue-50 text-blue-700',
    },
  ];
};
