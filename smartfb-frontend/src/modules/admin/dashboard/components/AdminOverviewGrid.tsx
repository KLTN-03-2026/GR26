import { AdminDataTableShell } from '@modules/admin/components/AdminDataTableShell';
import { AdminStatCard } from '@modules/admin/components/AdminStatCard';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import {
  AlertTriangle,
  Building2,
  CreditCard,
  PackageCheck,
  Users,
} from 'lucide-react';
import type { AdminDashboardOverview } from '../types/adminDashboard.types';

interface AdminOverviewGridProps {
  overview: AdminDashboardOverview;
}

const getTenantStatusLabel = (status: string): string => {
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
 * Lưới tổng quan dashboard admin gồm metric, tenant gần đây, invoice cần xử lý và phân bổ plan.
 */
export const AdminOverviewGrid = ({ overview }: AdminOverviewGridProps) => {
  const metrics = [
    {
      title: 'Tổng tenant',
      value: formatNumber(overview.totalTenants),
      helper: `${formatNumber(overview.activeTenants)} tenant đang hoạt động`,
      icon: Building2,
      tone: 'brand' as const,
    },
    {
      title: 'Tenant active',
      value: formatNumber(overview.activeTenants),
      helper: 'Đang sử dụng hệ thống',
      icon: Users,
      tone: 'success' as const,
    },
    {
      title: 'Tenant tạm khóa',
      value: formatNumber(overview.suspendedTenants),
      helper: 'Cần theo dõi hoặc xử lý billing',
      icon: AlertTriangle,
      tone: 'warning' as const,
    },
    {
      title: 'Hóa đơn chưa thanh toán',
      value: formatNumber(overview.unpaidInvoices),
      helper: formatVND(overview.unpaidAmount),
      icon: CreditCard,
      tone: overview.unpaidInvoices > 0 ? 'error' as const : 'success' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <AdminStatCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <AdminDataTableShell>
          <div className="border-b border-admin-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-admin-gray-900">Tenant mới gần đây</h2>
            <p className="mt-1 text-sm text-admin-gray-500">
              5 tenant mới nhất trong hệ thống SaaS.
            </p>
          </div>
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-admin-gray-50 text-xs font-semibold uppercase tracking-wide text-admin-gray-500">
              <tr>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Gói</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Chi nhánh</th>
                <th className="px-5 py-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-gray-200">
              {overview.recentTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-admin-gray-900">{tenant.name}</p>
                    <p className="mt-1 text-sm text-admin-gray-500">{tenant.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-admin-gray-700">{tenant.planName}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-admin-brand-50 px-2.5 py-1 text-xs font-semibold text-admin-brand-600">
                      {getTenantStatusLabel(tenant.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-admin-gray-700">
                    {formatNumber(tenant.branchCount)}
                  </td>
                  <td className="px-5 py-4 text-sm text-admin-gray-700">
                    {formatDate(tenant.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminDataTableShell>

        <div className="space-y-6">
          <div className="rounded-lg border border-admin-gray-200 bg-white shadow-sm">
            <div className="border-b border-admin-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-admin-gray-900">Hóa đơn cần xử lý</h2>
              <p className="mt-1 text-sm text-admin-gray-500">Các invoice đang ở trạng thái UNPAID.</p>
            </div>
            <div className="divide-y divide-admin-gray-200">
              {overview.pendingInvoices.length > 0 ? (
                overview.pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-admin-gray-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 truncate text-sm text-admin-gray-500">
                          {invoice.tenantName} · {invoice.planName}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-admin-error">
                        {formatVND(invoice.amount)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-admin-gray-500">
                      Chu kỳ {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-admin-gray-500">
                  Chưa có hóa đơn chưa thanh toán.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-admin-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-success-light text-admin-success">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-admin-gray-900">Phân bổ tenant theo gói</h2>
                <p className="mt-1 text-sm text-admin-gray-500">
                  {formatNumber(overview.activePlans)} gói active đang được cấu hình.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {overview.planDistribution.length > 0 ? (
                overview.planDistribution.map((item) => (
                  <div key={item.planName}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-admin-gray-700">{item.planName}</span>
                      <span className="font-semibold text-admin-gray-900">
                        {formatNumber(item.tenantCount)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-admin-gray-100">
                      <div
                        className="h-full rounded-full bg-admin-brand-500"
                        style={{
                          width: `${Math.max(8, (item.tenantCount / Math.max(overview.totalTenants, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-admin-gray-50 px-4 py-3 text-sm text-admin-gray-500">
                  Chưa có dữ liệu phân bổ gói.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
