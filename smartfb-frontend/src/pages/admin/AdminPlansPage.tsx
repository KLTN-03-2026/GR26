import { AdminEmptyState } from '@modules/admin/components/AdminEmptyState';
import { AdminErrorState } from '@modules/admin/components/AdminErrorState';
import { AdminLoadingState } from '@modules/admin/components/AdminLoadingState';
import { AdminPageHeader } from '@modules/admin/components/AdminPageHeader';
import { AdminPageToolbar } from '@modules/admin/components/AdminPageToolbar';
import { AdminPlanFilters } from '@modules/admin/plans/components/AdminPlanFilters';
import { AdminPlanFormDialog } from '@modules/admin/plans/components/AdminPlanFormDialog';
import { AdminPlanTable } from '@modules/admin/plans/components/AdminPlanTable';
import { DeactivatePlanDialog } from '@modules/admin/plans/components/DeactivatePlanDialog';
import { useAdminPlans } from '@modules/admin/plans/hooks/useAdminPlans';
import { useCreateAdminPlan } from '@modules/admin/plans/hooks/useCreateAdminPlan';
import { useDeactivateAdminPlan } from '@modules/admin/plans/hooks/useDeactivateAdminPlan';
import { useUpdateAdminPlan } from '@modules/admin/plans/hooks/useUpdateAdminPlan';
import type {
  AdminPlan,
  AdminPlanFormValues,
  AdminPlanListParams,
  AdminPlanStatusFilter,
} from '@modules/admin/plans/types/adminPlan.types';
import { Button } from '@shared/components/ui/button';
import { formatNumber } from '@shared/utils/formatCurrency';
import { Plus, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

const PAGE_SIZE = 10;

type PlanFormState =
  | {
      mode: 'create';
      plan: null;
    }
  | {
      mode: 'edit';
      plan: AdminPlan;
    };

const getActiveOnlyParam = (statusFilter: AdminPlanStatusFilter): boolean | undefined => {
  if (statusFilter === 'active') {
    return true;
  }

  if (statusFilter === 'inactive') {
    return false;
  }

  return undefined;
};

const getFormDialogKey = (state: PlanFormState): string => {
  return state.mode === 'create' ? 'create-plan' : `edit-plan-${state.plan.id}`;
};

const AdminPlansPage = () => {
  const [statusFilter, setStatusFilter] = useState<AdminPlanStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [formState, setFormState] = useState<PlanFormState | null>(null);
  const [deactivatingPlan, setDeactivatingPlan] = useState<AdminPlan | null>(null);

  const listParams = useMemo<AdminPlanListParams>(() => {
    return {
      page: currentPage,
      size: PAGE_SIZE,
      activeOnly: getActiveOnlyParam(statusFilter),
    };
  }, [currentPage, statusFilter]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminPlans(listParams);
  const createPlanMutation = useCreateAdminPlan();
  const updatePlanMutation = useUpdateAdminPlan();
  const deactivatePlanMutation = useDeactivateAdminPlan();

  const plans = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const isSubmittingForm = createPlanMutation.isPending || updatePlanMutation.isPending;

  const handleFilterChange = (nextFilter: AdminPlanStatusFilter) => {
    setStatusFilter(nextFilter);
    setCurrentPage(0);
  };

  const handleOpenCreateDialog = () => {
    setFormState({ mode: 'create', plan: null });
  };

  const handleOpenEditDialog = (plan: AdminPlan) => {
    setFormState({ mode: 'edit', plan });
  };

  const handleCloseFormDialog = (open: boolean) => {
    if (!open) {
      setFormState(null);
    }
  };

  const handleSubmitForm = (values: AdminPlanFormValues) => {
    if (!formState) {
      return;
    }

    if (formState.mode === 'create') {
      createPlanMutation.mutate(values, {
        onSuccess: () => setFormState(null),
      });
      return;
    }

    updatePlanMutation.mutate(
      {
        planId: formState.plan.id,
        payload: {
          name: values.name,
          priceMonthly: values.priceMonthly,
          maxBranches: values.maxBranches,
          maxStaff: values.maxStaff,
          maxMenuItems: values.maxMenuItems,
          features: values.features,
          isActive: values.isActive,
        },
      },
      {
        onSuccess: () => setFormState(null),
      }
    );
  };

  const handleDeactivatePlan = () => {
    if (!deactivatingPlan) {
      return;
    }

    deactivatePlanMutation.mutate(deactivatingPlan.id, {
      onSuccess: () => setDeactivatingPlan(null),
    });
  };

  const handleRetry = () => {
    void refetch();
  };

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Quản trị SaaS"
        title="Quản lý gói dịch vụ"
        description="Cấu hình giá, giới hạn sử dụng và tính năng cho từng plan."
        actions={(
          <>
            <Button
              type="button"
              variant="outline"
              className="border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
              onClick={handleRetry}
              disabled={isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </Button>
            <Button
              type="button"
              className="bg-admin-brand-500 hover:bg-admin-brand-600"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="h-4 w-4" />
              Tạo gói
            </Button>
          </>
        )}
      />

      <AdminPageToolbar
        meta={(
          <>
            Tổng cộng{' '}
            <span className="font-semibold text-admin-gray-900">
              {formatNumber(totalElements)}
            </span>{' '}
            gói
          </>
        )}
      >
        <AdminPlanFilters value={statusFilter} onChange={handleFilterChange} />
      </AdminPageToolbar>

      {isLoading ? (
        <AdminLoadingState
          title="Đang tải danh sách gói"
          description="Hệ thống đang lấy dữ liệu plan từ backend."
        />
      ) : null}

      {isError ? (
        <AdminErrorState
          title="Không thể tải danh sách gói"
          description="Vui lòng kiểm tra quyền admin, trạng thái backend hoặc thử tải lại dữ liệu."
          isRetrying={isFetching}
          onRetry={handleRetry}
        />
      ) : null}

      {!isLoading && !isError && plans.length === 0 ? (
        <AdminEmptyState
          eyebrow="Chưa có gói phù hợp"
          title="Không tìm thấy gói dịch vụ trong bộ lọc hiện tại"
          description="Bạn có thể đổi bộ lọc hoặc tạo gói dịch vụ đầu tiên cho hệ thống SaaS."
          action={(
            <Button
              type="button"
              className="bg-admin-brand-500 hover:bg-admin-brand-600"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="h-4 w-4" />
              Tạo gói
            </Button>
          )}
        />
      ) : null}

      {!isLoading && !isError && plans.length > 0 ? (
        <>
          <AdminPlanTable
            plans={plans}
            onEditPlan={handleOpenEditDialog}
            onDeactivatePlan={setDeactivatingPlan}
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

      {formState ? (
        <AdminPlanFormDialog
          key={getFormDialogKey(formState)}
          open
          plan={formState.plan}
          isSubmitting={isSubmittingForm}
          onOpenChange={handleCloseFormDialog}
          onSubmit={handleSubmitForm}
        />
      ) : null}

      <DeactivatePlanDialog
        plan={deactivatingPlan}
        isPending={deactivatePlanMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivatingPlan(null);
          }
        }}
        onConfirm={handleDeactivatePlan}
      />
    </section>
  );
};

export default AdminPlansPage;
