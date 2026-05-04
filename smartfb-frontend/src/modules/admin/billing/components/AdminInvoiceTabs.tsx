import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import type { AdminInvoiceStatusFilter } from '../types/adminBilling.types';

interface AdminInvoiceTabsProps {
  value: AdminInvoiceStatusFilter;
  onChange: (value: AdminInvoiceStatusFilter) => void;
}

const TAB_OPTIONS: Array<{
  value: AdminInvoiceStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

/**
 * Tabs lọc invoice theo trạng thái.
 */
export const AdminInvoiceTabs = ({ value, onChange }: AdminInvoiceTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {TAB_OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              'border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50',
              isActive && 'border-admin-brand-500 bg-admin-brand-50 text-admin-brand-600 hover:bg-admin-brand-50'
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};
