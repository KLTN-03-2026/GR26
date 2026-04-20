import type {
  TableArea,
  TableDisplayItem,
  TableStatus,
} from '@modules/table/types/table.types';
import type { ZoneWithStats } from '@modules/table/utils';

import { CreateBulkTablesDialog } from '../CreateBulkTablesDialog';
import { CreateTableDialog } from '../CreateTableDialog';
import { DeleteTableDialog } from '../DeleteTableDialog';
import { EditTableDialog } from '../EditTableDialog';
import { TableDetailDrawer } from '../TableDetailDrawer';
import { ZoneManagementDialog } from '../ZoneManagementDialog';

interface DeleteDialogState {
  open: boolean;
  id: string;
  name: string;
}

interface TableDialogsProps {
  drawerTable: TableDisplayItem | null;
  selectedTable: TableDisplayItem | null;
  zones: TableArea[];
  zonesWithStats: ZoneWithStats[];
  isDrawerOpen: boolean;
  isTableDetailLoading: boolean;
  isTableDetailError: boolean;
  isCreateDialogOpen: boolean;
  isZoneManagementDialogOpen: boolean;
  isCreateBulkDialogOpen: boolean;
  isEditDialogOpen: boolean;
  deleteDialog: DeleteDialogState;
  isZonesLoading: boolean;
  isZonesError: boolean;
  isZonesFetching: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onCreateDialogOpenChange: (open: boolean) => void;
  onZoneManagementDialogOpenChange: (open: boolean) => void;
  onCreateBulkDialogOpenChange: (open: boolean) => void;
  onEditDialogOpenChange: (open: boolean) => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onRetryTableDetail: () => void;
  onRetryZones: () => void;
  onRefetchTables: () => void;
  onEdit: (table: TableDisplayItem) => void;
  onToggleStatus: (id: string, currentStatus: TableStatus) => void;
}

export const TableDialogs = ({
  drawerTable,
  selectedTable,
  zones,
  zonesWithStats,
  isDrawerOpen,
  isTableDetailLoading,
  isTableDetailError,
  isCreateDialogOpen,
  isZoneManagementDialogOpen,
  isCreateBulkDialogOpen,
  isEditDialogOpen,
  deleteDialog,
  isZonesLoading,
  isZonesError,
  isZonesFetching,
  onDrawerOpenChange,
  onCreateDialogOpenChange,
  onZoneManagementDialogOpenChange,
  onCreateBulkDialogOpenChange,
  onEditDialogOpenChange,
  onDeleteDialogOpenChange,
  onRetryTableDetail,
  onRetryZones,
  onRefetchTables,
  onEdit,
  onToggleStatus,
}: TableDialogsProps) => {
  return (
    <>
      <TableDetailDrawer
        table={drawerTable}
        isOpen={isDrawerOpen}
        isLoading={isTableDetailLoading}
        isError={isTableDetailError}
        onClose={() => onDrawerOpenChange(false)}
        onRetry={onRetryTableDetail}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />

      <CreateTableDialog
        open={isCreateDialogOpen}
        onOpenChange={onCreateDialogOpenChange}
        onSuccess={onRefetchTables}
        zones={zones}
      />

      <ZoneManagementDialog
        open={isZoneManagementDialogOpen}
        onOpenChange={onZoneManagementDialogOpenChange}
        zones={zonesWithStats}
        isLoading={isZonesLoading}
        isError={isZonesError}
        isFetching={isZonesFetching}
        onRetry={onRetryZones}
      />

      <CreateBulkTablesDialog
        open={isCreateBulkDialogOpen}
        onOpenChange={onCreateBulkDialogOpenChange}
        onSuccess={onRefetchTables}
        zones={zones}
      />

      {selectedTable && (
        <EditTableDialog
          open={isEditDialogOpen}
          onOpenChange={onEditDialogOpenChange}
          table={selectedTable}
          zones={zones}
          onSuccess={() => {
            onEditDialogOpenChange(false);
            onRefetchTables();
          }}
        />
      )}

      <DeleteTableDialog
        open={deleteDialog.open}
        onOpenChange={onDeleteDialogOpenChange}
        tableId={deleteDialog.id}
        tableName={deleteDialog.name}
        onSuccess={onRefetchTables}
      />
    </>
  );
};
