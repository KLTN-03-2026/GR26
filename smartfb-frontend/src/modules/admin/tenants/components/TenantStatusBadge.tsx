import { cn } from '@shared/utils/cn';
import type { AdminTenantStatus } from '../types/adminTenant.types';

interface TenantStatusBadgeProps {
  status: AdminTenantStatus;
}

const getTenantStatusLabel = (status: AdminTenantStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Đang hoạt động';
    case 'SUSPENDED':
      return 'Tạm khóa';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
};

/**
 * Badge trạng thái tenant trong khu vực admin.
 */
export const TenantStatusBadge = ({ status }: TenantStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        status === 'ACTIVE' && 'bg-admin-success-light text-admin-success',
        status === 'SUSPENDED' && 'bg-admin-warning-light text-admin-warning',
        status === 'CANCELLED' && 'bg-admin-error-light text-admin-error',
        !['ACTIVE', 'SUSPENDED', 'CANCELLED'].includes(status) &&
          'bg-admin-gray-100 text-admin-gray-600'
      )}
    >
      {getTenantStatusLabel(status)}
    </span>
  );
};
