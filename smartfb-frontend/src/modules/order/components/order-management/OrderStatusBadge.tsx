import type { OrderStatus } from '@modules/order/types/order.types';
import { cn } from '@shared/utils/cn';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

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

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
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
