import { AdminDataTableShell } from '@modules/admin/components/AdminDataTableShell';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { CheckCircle2, Edit3, Eye, EyeOff } from 'lucide-react';
import type { AdminPlan } from '../types/adminPlan.types';

interface AdminPlanTableProps {
  plans: AdminPlan[];
  onViewPlan: (plan: AdminPlan) => void;
  onEditPlan: (plan: AdminPlan) => void;
  onDeactivatePlan: (plan: AdminPlan) => void;
}

const getEnabledFeatureCount = (plan: AdminPlan): number => {
  return Object.values(plan.features ?? {}).filter(Boolean).length;
};

/**
 * Bảng danh sách gói dịch vụ SaaS.
 */
export const AdminPlanTable = ({
  plans,
  onViewPlan,
  onEditPlan,
  onDeactivatePlan,
}: AdminPlanTableProps) => {
  return (
    <AdminDataTableShell>
      <Table className="min-w-[860px]">
        <TableHeader className="bg-admin-gray-50">
          <TableRow className="hover:bg-admin-gray-50">
            <TableHead className="text-admin-gray-500">Gói dịch vụ</TableHead>
            <TableHead className="text-admin-gray-500">Giá tháng</TableHead>
            <TableHead className="text-admin-gray-500">Giới hạn</TableHead>
            <TableHead className="text-admin-gray-500">Tính năng</TableHead>
            <TableHead className="text-admin-gray-500">Trạng thái</TableHead>
            <TableHead className="text-right text-admin-gray-500">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} className="hover:bg-admin-gray-50">
              <TableCell>
                <p className="font-semibold text-admin-gray-900">{plan.name}</p>
                <p className="mt-1 text-sm text-admin-gray-500">{plan.slug}</p>
              </TableCell>
              <TableCell className="font-semibold text-admin-gray-900">
                {formatVND(plan.priceMonthly)}
              </TableCell>
              <TableCell className="text-sm text-admin-gray-600">
                <p>{formatNumber(plan.maxBranches ?? 0)} chi nhánh</p>
                <p>{formatNumber(plan.maxStaff ?? 0)} nhân viên</p>
                <p>{formatNumber(plan.maxMenuItems ?? 0)} món</p>
              </TableCell>
              <TableCell className="text-sm text-admin-gray-600">
                {formatNumber(getEnabledFeatureCount(plan))} tính năng bật
              </TableCell>
              <TableCell>
                <span className={plan.isActive
                  ? 'inline-flex items-center gap-1 rounded-full bg-admin-success-light px-2.5 py-1 text-xs font-semibold text-admin-success'
                  : 'inline-flex items-center gap-1 rounded-full bg-admin-gray-100 px-2.5 py-1 text-xs font-semibold text-admin-gray-500'}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {plan.isActive ? 'Đang bán' : 'Đã ẩn'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
                    onClick={() => onViewPlan(plan)}
                  >
                    <Eye className="h-4 w-4" />
                    Xem
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
                    onClick={() => onEditPlan(plan)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Sửa
                  </Button>
                  {plan.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-admin-error text-admin-error hover:bg-admin-error-light"
                      onClick={() => onDeactivatePlan(plan)}
                    >
                      <EyeOff className="h-4 w-4" />
                      Ẩn
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminDataTableShell>
  );
};
