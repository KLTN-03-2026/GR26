
import { useMemo, useState } from 'react';
import { LayoutGrid, Users, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { buildOpenOrdersByTableMap, useOpenOrdersByTable } from '@modules/order/hooks/useOpenOrdersByTable';
import { useOrderStore } from '@modules/order/stores/orderStore';
import { useTableList } from '@modules/table/hooks/useTableList';
import { useZones } from '@modules/table/hooks/useZones';
import { useTableFilters } from '@modules/table/hooks/useTableFilters';
import { useTableDetail } from '@modules/table/hooks/useTableDetail';
import { useEditTable } from '@modules/table/hooks/useEditTable';

import { TableFilterBar } from '@modules/table/components/TableFilterBar';
import { TableGrid } from '@modules/table/components/TableGrid';
import { TableDetailDrawer } from '@modules/table/components/TableDetailDrawer';
import { EditTableDialog } from '@modules/table/components/EditTableDialog';
import { DeleteTableDialog } from '@modules/table/components/DeleteTableDialog';
import { CreateTableDialog } from '@modules/table/components/CreateTableDialog';
import { CreateBulkTablesDialog } from '@modules/table/components/CreateBulkTablesDialog';
import { ZoneManagementDialog } from '@modules/table/components/ZoneManagementDialog';

import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';
import type {
  TableDisplayItem,
  TableUsageStatus,
  UpdateTablePayload,
} from '@modules/table/types/table.types';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
}

const StatCard = ({ icon, iconBg, label, value, valueColor = "text-gray-900" }: StatCardProps) => (
  <div className="card">
    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
      <div className={`w-10 h-10 flex justify-center items-center rounded-2xl ${iconBg}`}>
        {icon}
      </div>
      <span className="text-amber-950 font-medium">{label}</span>
    </div>
    <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
  </div>
);

export default function TablesPage() {
  const navigate = useNavigate();
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const draftsByContext = useOrderStore((state) => state.draftsByContext);
  const { data: branches = [] } = useBranches();
  const { openOrdersByTable, refetch: refetchOpenOrders } = useOpenOrdersByTable();
  const { data: tables = [], isLoading, isError, refetch, error } = useTableList();
  const {
    data: zones = [],
    isLoading: zonesLoading,
    isError: zonesError,
    isFetching: zonesFetching,
    refetch: refetchZones,
  } = useZones();

  const [selectedTable, setSelectedTable] = useState<TableDisplayItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isZoneManagementDialogOpen, setIsZoneManagementDialogOpen] = useState(false);
  const [isCreateBulkDialogOpen, setIsCreateBulkDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });

  const { mutate: editTable } = useEditTable();
  const {
    data: selectedTableDetail,
    isLoading: isTableDetailLoading,
    isError: isTableDetailError,
    refetch: refetchTableDetail,
  } = useTableDetail(selectedTable?.id ?? '');

  const branchNameMap = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches]
  );

  const zoneNameMap = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone.name])),
    [zones]
  );

  const selectedBranchName = currentBranchId
    ? branchNameMap.get(currentBranchId) ?? 'Chi nhánh đang chọn'
    : 'Tất cả chi nhánh';

  const localDraftTableIds = useMemo(() => {
    return new Set(
      Object.values(draftsByContext)
        .map((draft) => draft.tableContext?.tableId)
        .filter((tableId): tableId is string => Boolean(tableId))
    );
  }, [draftsByContext]);

  const tableDisplayData = useMemo<TableDisplayItem[]>(() => {
    return tables.map((table) => {
      const resolvedBranchName =
        branchNameMap.get(table.branchId) ??
        (table.branchId === currentBranchId ? selectedBranchName : undefined) ??
        table.branchName ??
        'Chi nhánh không xác định';

      const resolvedZoneName =
        zoneNameMap.get(table.zoneId) ??
        table.zoneName ??
        'Chưa có khu vực';

      // Nếu FE còn giữ draft theo bàn thì ưu tiên hiển thị như bàn chưa thanh toán
      // để tránh hiểu nhầm bàn đã trống trong khi giỏ hàng vẫn còn.
      const resolvedUsageStatus =
        table.usageStatus === 'available' && localDraftTableIds.has(table.id)
          ? 'unpaid'
          : table.usageStatus;

      return {
        ...table,
        branchName: resolvedBranchName,
        zoneName: resolvedZoneName,
        usageStatus: resolvedUsageStatus,
      };
    });
  }, [
    branchNameMap,
    currentBranchId,
    localDraftTableIds,
    selectedBranchName,
    tables,
    zoneNameMap,
  ]);

  // Dùng zoneId làm giá trị filter để bám đúng dữ liệu API.
  const areaOptions = zones.map((zone) => ({
    value: zone.id,
    label: zone.name,
  }));

  const {
    filters,
    pagination,
    tables: filteredTables,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages,
  } = useTableFilters(tableDisplayData);

  const totalTables = tableDisplayData.length;
  const availableTables = tableDisplayData.filter(
    (t) => t.usageStatus === 'available' && t.status === 'active'
  ).length;
  const occupiedTables = tableDisplayData.filter(
    (t) => t.status === 'active' && (t.usageStatus === 'occupied' || t.usageStatus === 'unpaid')
  ).length;
  const zonesWithStats = zones.map((zone) => ({
    ...zone,
    tableCount: tables.filter((table) => table.zoneId === zone.id).length,
  }));
  const drawerTable = useMemo<TableDisplayItem | null>(() => {
    if (!selectedTableDetail) {
      return selectedTable;
    }

    const resolvedBranchName =
      branchNameMap.get(selectedTableDetail.branchId) ??
      (selectedTableDetail.branchId === currentBranchId ? selectedBranchName : undefined) ??
      selectedTable?.branchName ??
      selectedTableDetail.branchName ??
      'Chi nhánh không xác định';

    const resolvedZoneName =
      zoneNameMap.get(selectedTableDetail.zoneId) ??
      selectedTable?.zoneName ??
      selectedTableDetail.zoneName ??
      'Chưa có khu vực';

    return {
      ...selectedTableDetail,
      branchName: resolvedBranchName,
      zoneName: resolvedZoneName,
    };
  }, [branchNameMap, currentBranchId, selectedBranchName, selectedTable, selectedTableDetail, zoneNameMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Đang tải danh sách bàn...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Có lỗi xảy ra khi tải dữ liệu:
            <br />
            {error instanceof Error ? error.message : 'Lỗi không xác định'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const handleAddTable = () => {
    setIsCreateDialogOpen(true);
  };

  const handleManageZones = () => {
    setIsZoneManagementDialogOpen(true);
  };

  const handleCreateBulkTables = () => {
    setIsCreateBulkDialogOpen(true);
  };

  const handleViewDetail = (table: TableDisplayItem) => {
    setSelectedTable(table);
    setIsDrawerOpen(true);
  };

  /**
   * Giữ toàn bộ context của bàn trên URL để POS khôi phục đúng order/draft cả khi refresh.
   */
  const navigateToOrderPage = (table: TableDisplayItem, orderId?: string) => {
    // Điều hướng bằng query params để trang order đọc lại được cả khi người dùng refresh.
    const searchParams = new URLSearchParams();

    if (orderId?.trim()) {
      searchParams.set('orderId', orderId.trim());
    }

    searchParams.set('tableId', table.id);
    searchParams.set('tableName', table.name);

    if (table.zoneId?.trim()) {
      searchParams.set('zoneId', table.zoneId);
    }

    if (table.branchName?.trim()) {
      searchParams.set('branchName', table.branchName);
    }

    navigate(`${ROUTES.POS_ORDER}?${searchParams.toString()}`);
  };

  const handleSelectTable = async (table: TableDisplayItem) => {
    if (table.usageStatus === 'reserved') {
      toast.error('Bàn này đang được đặt trước. Không thể mở order mới từ bàn này.');
      return;
    }

    if (table.usageStatus === 'available') {
      navigateToOrderPage(table);
      return;
    }

    const localDraftExists = localDraftTableIds.has(table.id);
    const existingOpenOrder = openOrdersByTable.get(table.id);

    if (existingOpenOrder) {
      navigateToOrderPage(table, existingOpenOrder.id);
      return;
    }

    if (localDraftExists) {
      // Với draft chỉ tồn tại ở local storage, mở lại theo context bàn để OrderPage tự restore giỏ hàng.
      navigateToOrderPage(table);
      return;
    }

    const refreshedOrdersResult = await refetchOpenOrders();
    const refreshedOpenOrder = buildOpenOrdersByTableMap(refreshedOrdersResult.data ?? []).get(table.id);

    if (refreshedOpenOrder) {
      navigateToOrderPage(table, refreshedOpenOrder.id);
      return;
    }

    const statusMessageMap: Record<TableUsageStatus, string> = {
      available: '',
      occupied: 'Không tìm thấy đơn đang mở của bàn này. Vui lòng tải lại danh sách order hoặc kiểm tra màn quản lý order.',
      unpaid: 'Không tìm thấy đơn chờ thanh toán của bàn này. Vui lòng tải lại danh sách order hoặc kiểm tra màn quản lý order.',
      reserved: 'Bàn này đang được đặt trước. Không thể mở order mới từ bàn này.',
    };

    toast.error(statusMessageMap[table.usageStatus]);
  };

  const handleEdit = (table: TableDisplayItem) => {
    setSelectedTable(table);
    setIsEditDialogOpen(true);
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;

    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    const payload: UpdateTablePayload = {
      name: table.name,
      zoneId: table.zoneId,
      capacity: table.capacity,
      isActive: nextStatus === 'active',
      shape: table.shape,
    };

    editTable(
      { id, payload },
      {
        onSuccess: () => {
          refetch();
          if (selectedTable?.id === id) {
            setSelectedTable((prev) => prev && { ...prev, status: nextStatus });
          }
        },
      }
    );
  };

  const refetchTables = () => {
    refetch();
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<LayoutGrid className="h-5 w-5" style={{ color: "#2563EB" }} />}
          iconBg="bg-blue-100"
          label="Tổng số bàn"
          value={String(totalTables).padStart(2, "0")}
        />
        <StatCard
          icon={<Users className="h-5 w-5" style={{ color: "#16A34A" }} />}
          iconBg="bg-green-100"
          label="Bàn trống"
          value={String(availableTables).padStart(2, "0")}
          valueColor="text-green-600"
        />
        <StatCard
          icon={<Coffee className="h-5 w-5" style={{ color: "#E86A2C" }} />}
          iconBg="bg-orange-100"
          label="Đang có khách"
          value={String(occupiedTables).padStart(2, "0")}
          valueColor="text-orange-600"
        />
      </div>

      {/* Main Content */}
      <div className="bg-white p-4 space-y-4 rounded-2xl">
        <TableFilterBar
          filters={filters}
          areas={areaOptions}
          onSearchChange={(value) => updateFilter('search', value)}
          onAreaChange={(value) => updateFilter('area', value)}
          onStateChange={(value) => updateFilter('state', value)}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          onCreateSingleTable={handleAddTable}
          onCreateBulkTables={handleCreateBulkTables}
          onManageZones={handleManageZones}
        />

        <TableGrid
          tables={filteredTables}
          onSelectTable={handleSelectTable}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onViewDetail={(id) => {
            const table = tableDisplayData.find((item) => item.id === id);
            if (table) handleViewDetail(table);
          }}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              Hiển thị {(pagination.page - 1) * pagination.pageSize + 1} đến{' '}
              {Math.min(pagination.page * pagination.pageSize, totalItems)} trên {totalItems} bàn
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Trước
              </Button>
              <span className="px-3 py-1 text-sm">
                Trang {pagination.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePage(pagination.page + 1)}
                disabled={pagination.page === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers & Dialogs */}
      <TableDetailDrawer
        table={drawerTable}
        isOpen={isDrawerOpen}
        isLoading={isTableDetailLoading}
        isError={isTableDetailError}
        onClose={() => setIsDrawerOpen(false)}
        onRetry={() => {
          refetchTableDetail();
        }}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      <CreateTableDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetchTables}
        zones={zones}
      />

      <ZoneManagementDialog
        open={isZoneManagementDialogOpen}
        onOpenChange={setIsZoneManagementDialogOpen}
        zones={zonesWithStats}
        isLoading={zonesLoading}
        isError={zonesError}
        isFetching={zonesFetching}
        onRetry={() => {
          refetchZones();
        }}
      />

      <CreateBulkTablesDialog
        open={isCreateBulkDialogOpen}
        onOpenChange={setIsCreateBulkDialogOpen}
        onSuccess={refetchTables}
        zones={zones}
      />

      {selectedTable && (
        <EditTableDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          table={selectedTable}
          zones={zones}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            refetchTables();
          }}
        />
      )}

      <DeleteTableDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        tableId={deleteDialog.id}
        tableName={deleteDialog.name}
        onSuccess={refetchTables}
      />
    </div>
  );
}
