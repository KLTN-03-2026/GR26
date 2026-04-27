import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import type { AdminPlanStatusFilter } from '../types/adminPlan.types';

interface AdminPlanFiltersProps {
  value: AdminPlanStatusFilter;
  onChange: (value: AdminPlanStatusFilter) => void;
}

const FILTER_OPTIONS: Array<{
  value: AdminPlanStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang bán' },
  { value: 'inactive', label: 'Đã ẩn' },
];

/**
 * Bộ lọc trạng thái gói dịch vụ.
 */
export const AdminPlanFilters = ({ value, onChange }: AdminPlanFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => {
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
