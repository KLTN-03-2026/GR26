import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminDashboardService } from '../services/adminDashboardService';
import type {
  AdminDashboardOverview,
  AdminDashboardRawData,
  AdminPlanDistributionItem,
} from '../types/adminDashboard.types';

const getPlanDistribution = (
  rawData: AdminDashboardRawData
): AdminPlanDistributionItem[] => {
  const planCounts = new Map<string, number>();

  rawData.tenantDistributionPage.content.forEach((tenant) => {
    const planName = tenant.planName || 'Chưa có gói';
    planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
  });

  return Array.from(planCounts.entries())
    .map(([planName, tenantCount]) => ({
      planName,
      tenantCount,
    }))
    .sort((left, right) => right.tenantCount - left.tenantCount);
};

const buildDashboardOverview = (
  rawData: AdminDashboardRawData
): AdminDashboardOverview => {
  const unpaidAmount = rawData.unpaidInvoicesPage.content.reduce(
    (total, invoice) => total + invoice.amount,
    0
  );
  const activePlans = rawData.plansPage.content.filter((plan) => plan.isActive).length;
  const hasAnyData =
    rawData.tenantsPage.totalElements > 0 ||
    rawData.plansPage.totalElements > 0 ||
    rawData.unpaidInvoicesPage.totalElements > 0;

  return {
    totalTenants: rawData.tenantsPage.totalElements,
    activeTenants: rawData.activeTenantsPage.totalElements,
    suspendedTenants: rawData.suspendedTenantsPage.totalElements,
    unpaidInvoices: rawData.unpaidInvoicesPage.totalElements,
    unpaidAmount,
    recentTenants: rawData.tenantsPage.content,
    pendingInvoices: rawData.unpaidInvoicesPage.content,
    planDistribution: getPlanDistribution(rawData),
    activePlans,
    hasAnyData,
  };
};

/**
 * Hook tổng hợp dữ liệu dashboard admin từ các endpoint quản trị SaaS hiện có.
 */
export const useAdminDashboard = () =>
  useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: async () => {
      const rawData = await adminDashboardService.getDashboardRawData();
      return buildDashboardOverview(rawData);
    },
    staleTime: 60 * 1000,
  });
