import { useState } from 'react';
import { LayoutGrid, Users, Coffee } from 'lucide-react';
import { mockTableDetails, mockTableAreas } from '@modules/table/data/tableDetails';
import { useTableFilters } from '@modules/table/hooks/useTableFilters';
import { TableFilterBar } from '@modules/table/components/TableFilterBar';
import { TableGrid } from '@modules/table/components/TableGrid';
import { TableDetailDrawer } from '@modules/table/components/TableDetailDrawer';
import { EditTableDialog } from '@modules/table/components/EditTableDialog';
import { DeleteTableDialog } from '@modules/table/components/DeleteTableDialog';
import { CreateTableDialog } from '@modules/table/components/CreateTableDialog';
import { Button } from '@shared/components/ui/button';
import type { TableItem } from '@modules/table/types/table.types';
import { useEditTable } from '@modules/table/hooks/useEditTable';

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
  const [tables, setTables] = useState<TableItem[]>(mockTableDetails);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });

  const { mutate: editTable } = useEditTable();

  const {
    filters,
    pagination,
    areas,
    branches,
    tables: filteredTables,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages,
  } = useTableFilters(tables);

  const totalTables = tables.length;
  const availableTables = tables.filter((t) => t.usageStatus === 'available' && t.status === 'active').length;
  const occupiedTables = tables.filter((t) => t.usageStatus === 'occupied').length;

  const handleAddTable = () => {
    setIsCreateDialogOpen(true);
  };

  const handleViewDetail = (table: TableItem) => {
    setSelectedTable(table);
    setIsDrawerOpen(true);
  };

  const handleEdit = (table: TableItem) => {
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
    editTable(
      {
        id,
        payload: {
          name: table.name,
          areaId: table.areaId,
          capacity: table.capacity,
          branchId: table.branchId,
          status: nextStatus,
        },
      },
      {
        onSuccess: () => {
          setTables((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
          );
          if (selectedTable?.id === id) {
            setSelectedTable((prev) => prev && { ...prev, status: nextStatus });
          }
        },
      }
    );
  };

  const refetchTables = () => {
    setTables([...mockTableDetails]);
  };

  return (
    <div className="space-y-6 pb-8">
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

      <div className="bg-white p-4 space-y-4 rounded-2xl">
        <TableFilterBar
          filters={filters}
          areas={areas}
          branches={branches}
          onSearchChange={(value) => updateFilter('search', value)}
          onAreaChange={(value) => updateFilter('area', value)}
          onStatusChange={(value) => updateFilter('status', value)}
          onUsageStatusChange={(value) => updateFilter('usageStatus', value)}
          onBranchChange={(value) => updateFilter('branch', value)}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          onAddTable={handleAddTable}
        />

        <TableGrid
          tables={filteredTables}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onViewDetail={(id) => {
            const table = tables.find((t) => t.id === id);
            if (table) handleViewDetail(table);
          }}
        />

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

      <TableDetailDrawer
        table={selectedTable}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      <CreateTableDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetchTables}
      />

      {selectedTable && (
        <EditTableDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          table={selectedTable}
          areas={mockTableAreas}
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