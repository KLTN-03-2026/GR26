import { cn } from '@shared/utils/cn';
import type { AdminInvoiceStatus } from '../types/adminBilling.types';

interface InvoiceStatusBadgeProps {
  status: AdminInvoiceStatus;
}

const getInvoiceStatusLabel = (status: AdminInvoiceStatus): string => {
  switch (status) {
    case 'UNPAID':
      return 'Chưa thanh toán';
    case 'PAID':
      return 'Đã thanh toán';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
};

/**
 * Badge trạng thái hóa đơn subscription.
 */
export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        status === 'UNPAID' && 'bg-admin-warning-light text-admin-warning',
        status === 'PAID' && 'bg-admin-success-light text-admin-success',
        status === 'CANCELLED' && 'bg-admin-error-light text-admin-error',
        !['UNPAID', 'PAID', 'CANCELLED'].includes(status) &&
          'bg-admin-gray-100 text-admin-gray-600'
      )}
    >
      {getInvoiceStatusLabel(status)}
    </span>
  );
};
