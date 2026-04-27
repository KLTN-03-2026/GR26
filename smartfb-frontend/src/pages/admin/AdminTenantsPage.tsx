import { AdminEmptyState } from '@modules/admin/components/AdminEmptyState';
import { AdminErrorState } from '@modules/admin/components/AdminErrorState';
import { AdminLoadingState } from '@modules/admin/components/AdminLoadingState';
import { AdminPageHeader } from '@modules/admin/components/AdminPageHeader';
import { AdminPageToolbar } from '@modules/admin/components/AdminPageToolbar';
import { AdminTenantDetailDrawer } from '@modules/admin/tenants/components/AdminTenantDetailDrawer';
import { AdminTenantFilters } from '@modules/admin/tenants/components/AdminTenantFilters';
import { AdminTenantTable } from '@modules/admin/tenants/components/AdminTenantTable';
import { ChangeTenantPlanDialog } from '@modules/admin/tenants/components/ChangeTenantPlanDialog';
import { TenantStatusActionDialog } from '@modules/admin/tenants/components/TenantStatusActionDialog';
import { useAdminActivePlans } from '@modules/admin/tenants/hooks/useAdminActivePlans';
import { useAdminTenants } from '@modules/admin/tenants/hooks/useAdminTenants';
import { useChangeTenantPlan } from '@modules/admin/tenants/hooks/useChangeTenantPlan';
import { useReactivateTenant } from '@modules/admin/tenants/hooks/useReactivateTenant';
import { useSuspendTenant } from '@modules/admin/tenants/hooks/useSuspendTenant';
import type {
  AdminTenantListParams,
  AdminTenantStatusFilter,
  AdminTenantSummary,
  ChangeTenantPlanPayload,
} from '@modules/admin/tenants/types/adminTenant.types';
import { Button } from '@shared/components/ui/button';
import { useDebounce } from '@shared/hooks/useDebounce';
import { formatNumber } from '@shared/utils/formatCurrency';
import { RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

const PAGE_SIZE = 10;

interface TenantStatusActionState {
  tenant: AdminTenantSummary;
  action: 'suspend' | 'reactivate';
}

const getStatusParam = (status: AdminTenantStatusFilter): string | undefined => {
  return status === 'all' ? undefined : status;
};

const AdminTenantsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminTenantStatusFilter>('all');
  const [planId, setPlanId] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTenant, setSelectedTenant] = useState<AdminTenantSummary | null>(null);
  const [statusAction, setStatusAction] = useState<TenantStatusActionState | null>(null);
  const [changePlanTenant, setChangePlanTenant] = useState<AdminTenantSummary | null>(null);
  const debouncedKeyword = useDebounce(keyword.trim(), 300);

  const listParams = useMemo<AdminTenantListParams>(() => {
    return {
      page: currentPage,
      size: PAGE_SIZE,
      keyword: debouncedKeyword || undefined,
      status: getStatusParam(statusFilter),
      planId: planId || undefined,
    };
  }, [currentPage, debouncedKeyword, planId, statusFilter]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminTenants(listParams);
  const {
    data: activePlansPage,
    isLoading: isActivePlansLoading,
  } = useAdminActivePlans();
  const suspendTenantMutation = useSuspendTenant();
  const reactivateTenantMutation = useReactivateTenant();
  const changeTenantPlanMutation = useChangeTenantPlan();

  const tenants = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const activePlans = activePlansPage?.content ?? [];
  const isStatusActionPending = suspendTenantMutation.isPending || reactivateTenantMutation.isPending;

  const handleFilterKeywordChange = (value: string) => {
    setKeyword(value);
    setCurrentPage(0);
  };

  const handleStatusChange = (value: AdminTenantStatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const handlePlanChange = (value: string) => {
    setPlanId(value);
    setCurrentPage(0);
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleConfirmSuspend = (reason: string) => {
    if (!statusAction || statusAction.action !== 'suspend') {
      return;
    }

    suspendTenantMutation.mutate(
      {
        tenantId: statusAction.tenant.id,
        payload: { reason },
      },
      {
        onSuccess: () => setStatusAction(null),
      }
    );
  };

  const handleConfirmReactivate = () => {
    if (!statusAction || statusAction.action !== 'reactivate') {
      return;
    }

    reactivateTenantMutation.mutate(statusAction.tenant.id, {
      onSuccess: () => setStatusAction(null),
    });
  };

  const handleSubmitChangePlan = (payload: ChangeTenantPlanPayload) => {
    if (!changePlanTenant) {
      return;
    }

    changeTenantPlanMutation.mutate(
      {
        tenantId: changePlanTenant.id,
        payload,
      },
      {
        onSuccess: () => setChangePlanTenant(null),
      }
    );
  };

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Quản trị SaaS"
        title="Quản lý tenant"
        description="Theo dõi khách hàng, trạng thái thuê bao và thao tác đổi gói dịch vụ."
        actions={(
          <Button
            type="button"
            variant="outline"
            className="w-fit border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
            onClick={handleRetry}
            disabled={isFetching}
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </Button>
        )}
      />

      <AdminPageToolbar
        meta={(
          <div className="flex flex-col gap-1 text-left md:text-right">
            <span>
              Tổng cộng{' '}
              <span className="font-semibold text-admin-gray-900">
                {formatNumber(totalElements)}
              </span>{' '}
              tenant
            </span>
            <span>
              {isActivePlansLoading ? 'Đang tải danh sách gói...' : `${formatNumber(activePlans.length)} gói active`}
            </span>
          </div>
        )}
      >
        <AdminTenantFilters
          keyword={keyword}
          status={statusFilter}
          planId={planId}
          plans={activePlans}
          onKeywordChange={handleFilterKeywordChange}
          onStatusChange={handleStatusChange}
          onPlanChange={handlePlanChange}
        />
      </AdminPageToolbar>

      {isLoading ? (
        <AdminLoadingState
          title="Đang tải danh sách tenant"
          description="Hệ thống đang lấy tenant theo bộ lọc hiện tại."
        />
      ) : null}

      {isError ? (
        <AdminErrorState
          title="Không thể tải danh sách tenant"
          description="Vui lòng kiểm tra quyền admin, trạng thái backend hoặc thử tải lại dữ liệu."
          isRetrying={isFetching}
          onRetry={handleRetry}
        />
      ) : null}

      {!isLoading && !isError && tenants.length === 0 ? (
        <AdminEmptyState
          eyebrow="Chưa có tenant phù hợp"
          title="Không tìm thấy tenant trong bộ lọc hiện tại"
          description="Hãy đổi từ khóa, trạng thái hoặc gói dịch vụ để mở rộng kết quả tìm kiếm."
        />
      ) : null}

      {!isLoading && !isError && tenants.length > 0 ? (
        <>
          <AdminTenantTable
            tenants={tenants}
            onViewDetail={setSelectedTenant}
            onSuspend={(tenant) => setStatusAction({ tenant, action: 'suspend' })}
            onReactivate={(tenant) => setStatusAction({ tenant, action: 'reactivate' })}
            onChangePlan={setChangePlanTenant}
          />
          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 bg-white px-4 py-3 text-sm text-admin-gray-600 shadow-sm">
            <span>
              Trang {formatNumber(currentPage + 1)} / {formatNumber(Math.max(totalPages, 1))}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
                disabled={currentPage === 0}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => page + 1)}
                disabled={currentPage + 1 >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <AdminTenantDetailDrawer
        tenant={selectedTenant}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTenant(null);
          }
        }}
      />

      <TenantStatusActionDialog
        tenant={statusAction?.tenant ?? null}
        action={statusAction?.action ?? null}
        isPending={isStatusActionPending}
        onOpenChange={(open) => {
          if (!open) {
            setStatusAction(null);
          }
        }}
        onConfirmSuspend={handleConfirmSuspend}
        onConfirmReactivate={handleConfirmReactivate}
      />

      {changePlanTenant ? (
        <ChangeTenantPlanDialog
          key={changePlanTenant.id}
          tenant={changePlanTenant}
          plans={activePlans}
          isPending={changeTenantPlanMutation.isPending}
          onOpenChange={(open) => {
            if (!open) {
              setChangePlanTenant(null);
            }
          }}
          onSubmit={handleSubmitChangePlan}
        />
      ) : null}
    </section>
  );
};

export default AdminTenantsPage;
