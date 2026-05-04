import { Input } from '@shared/components/ui/input';
import type { AdminTenantPlan } from '../types/adminTenant.types';
import type { AdminTenantStatusFilter } from '../types/adminTenant.types';

interface AdminTenantFiltersProps {
  keyword: string;
  status: AdminTenantStatusFilter;
  planId: string;
  plans: AdminTenantPlan[];
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: AdminTenantStatusFilter) => void;
  onPlanChange: (value: string) => void;
}

/**
 * Bộ lọc danh sách tenant gồm tìm kiếm, trạng thái và gói dịch vụ.
 */
export const AdminTenantFilters = ({
  keyword,
  status,
  planId,
  plans,
  onKeywordChange,
  onStatusChange,
  onPlanChange,
}: AdminTenantFiltersProps) => {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
      <Input
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="Tìm theo tên tenant hoặc email..."
        className="border-admin-gray-200 focus-visible:ring-admin-brand-500"
      />
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as AdminTenantStatusFilter)}
        className="h-10 rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="SUSPENDED">Tạm khóa</option>
        <option value="CANCELLED">Đã hủy</option>
      </select>
      <select
        value={planId}
        onChange={(event) => onPlanChange(event.target.value)}
        className="h-10 rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
      >
        <option value="">Tất cả gói</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </select>
    </div>
  );
};
