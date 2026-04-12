
import { useMemo, useState } from 'react';

import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import {
  TableDialogs,
  TableFilterBar,
  TableGrid,
  TableStatsSection,
} from '@modules/table/components';
import {
  useEditTable,
  useTableDetail,
  useTableFilters,
  useTableList,
  useTableOrderNavigation,
  useZones,
} from '@modules/table/hooks';
import type {
  TableDisplayItem,
  TableStatus,
  UpdateTablePayload,
} from '@modules/table/types/table.types';
import {
  buildTablePresentationData,
  resolveDrawerTable,
} from '@modules/table/utils';

import { Button } from '@shared/components/ui/button';

export default function TablesPage() {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const { data: branches = [] } = useBranches();
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
  const { handleSelectTable } = useTableOrderNavigation();

  const { mutate: editTable } = useEditTable();
  const {
    data: selectedTableDetail,
    isLoading: isTableDetailLoading,
    isError: isTableDetailError,
    refetch: refetchTableDetail,
  } = useTableDetail(selectedTable?.id ?? '');

  const { tableDisplayData, areaOptions, tableStats, zonesWithStats } = useMemo(() => {
    return buildTablePresentationData({
      branches,
      zones,
      tables,
      currentBranchId,
    });
  }, [branches, currentBranchId, tables, zones]);

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

  const drawerTable = useMemo<TableDisplayItem | null>(() => {
    return resolveDrawerTable({
      branches,
      zones,
      currentBranchId,
      selectedTable,
      selectedTableDetail,
    });
  }, [branches, currentBranchId, selectedTable, selectedTableDetail, zones]);

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

  const handleEdit = (table: TableDisplayItem) => {
    setSelectedTable(table);
    setIsEditDialogOpen(true);
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  const handleToggleStatus = (id: string, currentStatus: TableStatus) => {
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
      <TableStatsSection
        totalTables={tableStats.totalTables}
        availableTables={tableStats.availableTables}
        occupiedTables={tableStats.occupiedTables}
      />

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

      <TableDialogs
        drawerTable={drawerTable}
        selectedTable={selectedTable}
        zones={zones}
        zonesWithStats={zonesWithStats}
        isDrawerOpen={isDrawerOpen}
        isTableDetailLoading={isTableDetailLoading}
        isTableDetailError={isTableDetailError}
        isCreateDialogOpen={isCreateDialogOpen}
        isZoneManagementDialogOpen={isZoneManagementDialogOpen}
        isCreateBulkDialogOpen={isCreateBulkDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        deleteDialog={deleteDialog}
        isZonesLoading={zonesLoading}
        isZonesError={zonesError}
        isZonesFetching={zonesFetching}
        onDrawerOpenChange={setIsDrawerOpen}
        onCreateDialogOpenChange={setIsCreateDialogOpen}
        onZoneManagementDialogOpenChange={setIsZoneManagementDialogOpen}
        onCreateBulkDialogOpenChange={setIsCreateBulkDialogOpen}
        onEditDialogOpenChange={setIsEditDialogOpen}
        onDeleteDialogOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onRetryTableDetail={refetchTableDetail}
        onRetryZones={refetchZones}
        onRefetchTables={refetchTables}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
