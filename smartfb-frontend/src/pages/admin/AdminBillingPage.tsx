import { AdminEmptyState } from '@modules/admin/components/AdminEmptyState';
import { AdminErrorState } from '@modules/admin/components/AdminErrorState';
import { AdminLoadingState } from '@modules/admin/components/AdminLoadingState';
import { AdminPageHeader } from '@modules/admin/components/AdminPageHeader';
import { AdminPageToolbar } from '@modules/admin/components/AdminPageToolbar';
import { AdminInvoiceDetailDrawer } from '@modules/admin/billing/components/AdminInvoiceDetailDrawer';
import { AdminInvoiceTable } from '@modules/admin/billing/components/AdminInvoiceTable';
import { AdminInvoiceTabs } from '@modules/admin/billing/components/AdminInvoiceTabs';
import { CancelInvoiceDialog } from '@modules/admin/billing/components/CancelInvoiceDialog';
import { CreateRenewalInvoiceDialog } from '@modules/admin/billing/components/CreateRenewalInvoiceDialog';
import { MarkInvoicePaidDialog } from '@modules/admin/billing/components/MarkInvoicePaidDialog';
import { useAdminInvoices } from '@modules/admin/billing/hooks/useAdminInvoices';
import { useAdminTenantInvoices } from '@modules/admin/billing/hooks/useAdminTenantInvoices';
import { useCancelInvoice } from '@modules/admin/billing/hooks/useCancelInvoice';
import { useCreateRenewalInvoice } from '@modules/admin/billing/hooks/useCreateRenewalInvoice';
import { useMarkInvoicePaid } from '@modules/admin/billing/hooks/useMarkInvoicePaid';
import type {
  AdminInvoice,
  AdminInvoiceListParams,
  AdminInvoiceStatusFilter,
  CancelInvoicePayload,
  CreateRenewalInvoicePayload,
  MarkInvoicePaidPayload,
} from '@modules/admin/billing/types/adminBilling.types';
import { useAdminActivePlans } from '@modules/admin/tenants/hooks/useAdminActivePlans';
import { useAdminTenants } from '@modules/admin/tenants/hooks/useAdminTenants';
import { Button } from '@shared/components/ui/button';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { FilePlus2, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

const PAGE_SIZE = 10;

const getStatusParam = (status: AdminInvoiceStatusFilter): string | undefined => {
  return status === 'all' ? undefined : status;
};

const AdminBillingPage = () => {
  const [statusFilter, setStatusFilter] = useState<AdminInvoiceStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<AdminInvoice | null>(null);
  const [cancelInvoice, setCancelInvoice] = useState<AdminInvoice | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const listParams = useMemo<AdminInvoiceListParams>(() => {
    return {
      page: currentPage,
      size: PAGE_SIZE,
      status: getStatusParam(statusFilter),
    };
  }, [currentPage, statusFilter]);

  const tenantInvoiceParams = useMemo(() => {
    return {
      page: currentPage,
      size: PAGE_SIZE,
    };
  }, [currentPage]);

  const {
    data: allInvoicePage,
    isLoading: isAllInvoicesLoading,
    isError: isAllInvoicesError,
    isFetching: isAllInvoicesFetching,
    refetch: refetchAllInvoices,
  } = useAdminInvoices(listParams);
  const {
    data: tenantInvoicePage,
    isLoading: isTenantInvoicesLoading,
    isError: isTenantInvoicesError,
    isFetching: isTenantInvoicesFetching,
    refetch: refetchTenantInvoices,
  } = useAdminTenantInvoices(selectedTenantId, tenantInvoiceParams);
  const { data: activeTenantsPage } = useAdminTenants({
    page: 0,
    size: 100,
    status: 'ACTIVE',
  });
  const { data: activePlans } = useAdminActivePlans();
  const createRenewalInvoiceMutation = useCreateRenewalInvoice();
  const markInvoicePaidMutation = useMarkInvoicePaid();
  const cancelInvoiceMutation = useCancelInvoice();

  const activeTenants = activeTenantsPage?.content ?? [];
  const selectedTenant = activeTenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const currentInvoicePage = selectedTenantId ? tenantInvoicePage : allInvoicePage;
  const rawInvoices = currentInvoicePage?.content ?? [];
  const invoices =
    selectedTenantId && statusFilter !== 'all'
      ? rawInvoices.filter((invoice) => invoice.status === statusFilter)
      : rawInvoices;
  const totalPages = currentInvoicePage?.totalPages ?? 0;
  const totalElements =
    selectedTenantId && statusFilter !== 'all'
      ? invoices.length
      : currentInvoicePage?.totalElements ?? 0;
  const isLoading = selectedTenantId ? isTenantInvoicesLoading : isAllInvoicesLoading;
  const isError = selectedTenantId ? isTenantInvoicesError : isAllInvoicesError;
  const isFetching = selectedTenantId ? isTenantInvoicesFetching : isAllInvoicesFetching;
  const activePlanOptions = activePlans ?? [];
  const totalAmountOnPage = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  const handleStatusChange = (nextStatus: AdminInvoiceStatusFilter) => {
    setStatusFilter(nextStatus);
    setCurrentPage(0);
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setCurrentPage(0);
  };

  const handleRetry = () => {
    if (selectedTenantId) {
      void refetchTenantInvoices();
      return;
    }

    void refetchAllInvoices();
  };

  const handleCreateInvoice = (payload: CreateRenewalInvoicePayload) => {
    createRenewalInvoiceMutation.mutate(payload, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };

  const handleMarkPaid = (payload: MarkInvoicePaidPayload) => {
    if (!markPaidInvoice) {
      return;
    }

    markInvoicePaidMutation.mutate(
      {
        invoiceId: markPaidInvoice.id,
        payload,
      },
      {
        onSuccess: () => setMarkPaidInvoice(null),
      }
    );
  };

  const handleCancelInvoice = (payload: CancelInvoicePayload) => {
    if (!cancelInvoice) {
      return;
    }

    cancelInvoiceMutation.mutate(
      {
        invoiceId: cancelInvoice.id,
        payload,
      },
      {
        onSuccess: () => setCancelInvoice(null),
      }
    );
  };

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Billing SaaS"
        title="Quản lý hóa đơn subscription"
        description="Theo dõi invoice, tạo hóa đơn gia hạn và xác nhận thanh toán cho tenant."
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
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <FilePlus2 className="h-4 w-4" />
              Tạo hóa đơn
            </Button>
          </>
        )}
      />

      <AdminPageToolbar
        meta={(
          <>
            <span className="font-semibold text-admin-gray-900">
              {formatNumber(totalElements)}
            </span>{' '}
            hóa đơn ·{' '}
            <span className="font-semibold text-admin-gray-900">
              {formatVND(totalAmountOnPage)}
            </span>{' '}
            trên trang
            {selectedTenant ? (
              <>
                {' '}· Tenant{' '}
                <span className="font-semibold text-admin-gray-900">{selectedTenant.name}</span>
              </>
            ) : null}
          </>
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AdminInvoiceTabs value={statusFilter} onChange={handleStatusChange} />
          <select
            value={selectedTenantId}
            onChange={(event) => handleTenantChange(event.target.value)}
            className="h-9 min-w-[260px] rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
          >
            <option value="">Tất cả tenant</option>
            {activeTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} - {tenant.email}
              </option>
            ))}
          </select>
        </div>
      </AdminPageToolbar>

      {isLoading ? (
        <AdminLoadingState
          title="Đang tải danh sách hóa đơn"
          description="Hệ thống đang lấy invoice theo trạng thái hiện tại."
        />
      ) : null}

      {isError ? (
        <AdminErrorState
          title="Không thể tải danh sách hóa đơn"
          description="Vui lòng kiểm tra quyền admin, trạng thái backend hoặc thử tải lại dữ liệu."
          isRetrying={isFetching}
          onRetry={handleRetry}
        />
      ) : null}

      {!isLoading && !isError && invoices.length === 0 ? (
        <AdminEmptyState
          eyebrow="Chưa có hóa đơn phù hợp"
          title="Không tìm thấy invoice trong bộ lọc hiện tại"
          description="Bạn có thể đổi trạng thái hoặc tạo hóa đơn gia hạn mới cho tenant."
          action={(
            <Button
              type="button"
              className="bg-admin-brand-500 hover:bg-admin-brand-600"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <FilePlus2 className="h-4 w-4" />
              Tạo hóa đơn
            </Button>
          )}
        />
      ) : null}

      {!isLoading && !isError && invoices.length > 0 ? (
        <>
          <AdminInvoiceTable
            invoices={invoices}
            onViewDetail={setSelectedInvoice}
            onMarkPaid={setMarkPaidInvoice}
            onCancelInvoice={setCancelInvoice}
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

      <CreateRenewalInvoiceDialog
        open={isCreateDialogOpen}
        tenants={activeTenants}
        plans={activePlanOptions}
        isPending={createRenewalInvoiceMutation.isPending}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateInvoice}
      />

      <AdminInvoiceDetailDrawer
        invoice={selectedInvoice}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoice(null);
          }
        }}
      />

      <MarkInvoicePaidDialog
        invoice={markPaidInvoice}
        isPending={markInvoicePaidMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setMarkPaidInvoice(null);
          }
        }}
        onSubmit={handleMarkPaid}
      />

      <CancelInvoiceDialog
        invoice={cancelInvoice}
        isPending={cancelInvoiceMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setCancelInvoice(null);
          }
        }}
        onSubmit={handleCancelInvoice}
      />
    </section>
  );
};

export default AdminBillingPage;
