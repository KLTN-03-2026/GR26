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
import { formatNumber } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import { Eye, Lock, RefreshCw, Repeat2, Unlock } from 'lucide-react';
import type { AdminTenantSummary } from '../types/adminTenant.types';
import { TenantStatusBadge } from './TenantStatusBadge';

interface AdminTenantTableProps {
  tenants: AdminTenantSummary[];
  onViewDetail: (tenant: AdminTenantSummary) => void;
  onSuspend: (tenant: AdminTenantSummary) => void;
  onReactivate: (tenant: AdminTenantSummary) => void;
  onChangePlan: (tenant: AdminTenantSummary) => void;
}

/**
 * Bảng tenant trong khu vực admin SaaS.
 */
export const AdminTenantTable = ({
  tenants,
  onViewDetail,
  onSuspend,
  onReactivate,
  onChangePlan,
}: AdminTenantTableProps) => {
  return (
    <AdminDataTableShell>
      <Table className="min-w-[940px]">
        <TableHeader className="bg-admin-gray-50">
          <TableRow className="hover:bg-admin-gray-50">
            <TableHead className="text-admin-gray-500">Tenant</TableHead>
            <TableHead className="text-admin-gray-500">Gói hiện tại</TableHead>
            <TableHead className="text-admin-gray-500">Hết hạn</TableHead>
            <TableHead className="text-admin-gray-500">Chi nhánh</TableHead>
            <TableHead className="text-admin-gray-500">Trạng thái</TableHead>
            <TableHead className="text-right text-admin-gray-500">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id} className="hover:bg-admin-gray-50">
              <TableCell>
                <p className="font-semibold text-admin-gray-900">{tenant.name}</p>
                <p className="mt-1 text-sm text-admin-gray-500">{tenant.email}</p>
              </TableCell>
              <TableCell className="text-sm text-admin-gray-700">{tenant.planName}</TableCell>
              <TableCell className="text-sm text-admin-gray-700">
                {tenant.planExpiresAt ? formatDate(tenant.planExpiresAt) : 'Chưa có'}
              </TableCell>
              <TableCell className="text-sm text-admin-gray-700">
                {formatNumber(tenant.branchCount)}
              </TableCell>
              <TableCell>
                <TenantStatusBadge status={tenant.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
                    onClick={() => onViewDetail(tenant)}
                  >
                    <Eye className="h-4 w-4" />
                    Xem
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
                    onClick={() => onChangePlan(tenant)}
                  >
                    <Repeat2 className="h-4 w-4" />
                    Đổi gói
                  </Button>
                  {tenant.status === 'SUSPENDED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-admin-success text-admin-success hover:bg-admin-success-light"
                      onClick={() => onReactivate(tenant)}
                    >
                      <Unlock className="h-4 w-4" />
                      Mở
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-admin-warning text-admin-warning hover:bg-admin-warning-light"
                      onClick={() => onSuspend(tenant)}
                      disabled={tenant.status === 'CANCELLED'}
                    >
                      {tenant.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                      Khóa
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminDataTableShell>
  );
};
