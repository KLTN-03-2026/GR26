import type {
  TableArea,
  TableDetail,
  TableDisplayItem,
  TableItem,
  TableUsageStatus,
} from '@modules/table/types/table.types';

interface TableBranchSummary {
  id: string;
  name: string;
}

interface BuildTablePresentationDataParams {
  branches: TableBranchSummary[];
  zones: TableArea[];
  tables: TableItem[];
  currentBranchId: string | null;
}

interface ResolveDrawerTableParams {
  branches: TableBranchSummary[];
  zones: TableArea[];
  currentBranchId: string | null;
  selectedTable: TableDisplayItem | null;
  selectedTableDetail?: TableDetail | null;
}

export interface TableAreaOption {
  value: string;
  label: string;
}

export interface TableStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
}

export interface ZoneWithStats extends TableArea {
  tableCount: number;
}

interface TablePresentationData {
  tableDisplayData: TableDisplayItem[];
  areaOptions: TableAreaOption[];
  tableStats: TableStats;
  zonesWithStats: ZoneWithStats[];
}

const buildBranchNameMap = (branches: TableBranchSummary[]) => {
  return new Map(branches.map((branch) => [branch.id, branch.name]));
};

const buildZoneNameMap = (zones: TableArea[]) => {
  return new Map(zones.map((zone) => [zone.id, zone.name]));
};

const resolveSelectedBranchName = (
  branchNameMap: Map<string, string>,
  currentBranchId: string | null
) => {
  if (!currentBranchId) {
    return 'Tất cả chi nhánh';
  }

  return branchNameMap.get(currentBranchId) ?? 'Chi nhánh đang chọn';
};

const resolveBranchName = (
  table: Pick<TableItem, 'branchId' | 'branchName'>,
  branchNameMap: Map<string, string>,
  currentBranchId: string | null,
  selectedBranchName: string,
  fallbackBranchName?: string
) => {
  return (
    branchNameMap.get(table.branchId) ??
    (table.branchId === currentBranchId ? selectedBranchName : undefined) ??
    fallbackBranchName ??
    table.branchName ??
    'Chi nhánh không xác định'
  );
};

const resolveZoneName = (
  table: Pick<TableItem, 'zoneId' | 'zoneName'>,
  zoneNameMap: Map<string, string>,
  fallbackZoneName?: string
) => {
  return zoneNameMap.get(table.zoneId) ?? fallbackZoneName ?? table.zoneName ?? 'Chưa có khu vực';
};

const isOccupiedTable = (usageStatus: TableUsageStatus) => {
  return usageStatus === 'occupied' || usageStatus === 'unpaid';
};

/**
 * Gom toàn bộ dữ liệu trình bày của màn quản lý bàn về một chỗ để page chỉ còn làm nhiệm vụ compose.
 */
export const buildTablePresentationData = ({
  branches,
  zones,
  tables,
  currentBranchId,
}: BuildTablePresentationDataParams): TablePresentationData => {
  const branchNameMap = buildBranchNameMap(branches);
  const zoneNameMap = buildZoneNameMap(zones);
  const selectedBranchName = resolveSelectedBranchName(branchNameMap, currentBranchId);

  const tableDisplayData = tables.map<TableDisplayItem>((table) => ({
    ...table,
    branchName: resolveBranchName(
      table,
      branchNameMap,
      currentBranchId,
      selectedBranchName
    ),
    zoneName: resolveZoneName(table, zoneNameMap),
  }));

  const areaOptions = zones.map<TableAreaOption>((zone) => ({
    value: zone.id,
    label: zone.name,
  }));

  const tableStats = tableDisplayData.reduce<TableStats>(
    (accumulator, table) => {
      accumulator.totalTables += 1;

      if (table.usageStatus === 'available' && table.status === 'active') {
        accumulator.availableTables += 1;
      }

      if (table.status === 'active' && isOccupiedTable(table.usageStatus)) {
        accumulator.occupiedTables += 1;
      }

      return accumulator;
    },
    {
      totalTables: 0,
      availableTables: 0,
      occupiedTables: 0,
    }
  );

  const zonesWithStats = zones.map<ZoneWithStats>((zone) => ({
    ...zone,
    tableCount: tables.filter((table) => table.zoneId === zone.id).length,
  }));

  return {
    tableDisplayData,
    areaOptions,
    tableStats,
    zonesWithStats,
  };
};

/**
 * Resolve dữ liệu drawer ưu tiên bản chi tiết mới nhất nhưng vẫn giữ tên chi nhánh và khu vực đã join ở UI.
 */
export const resolveDrawerTable = ({
  branches,
  zones,
  currentBranchId,
  selectedTable,
  selectedTableDetail,
}: ResolveDrawerTableParams): TableDisplayItem | null => {
  if (!selectedTableDetail) {
    return selectedTable;
  }

  const branchNameMap = buildBranchNameMap(branches);
  const zoneNameMap = buildZoneNameMap(zones);
  const selectedBranchName = resolveSelectedBranchName(branchNameMap, currentBranchId);

  return {
    ...selectedTableDetail,
    branchName: resolveBranchName(
      selectedTableDetail,
      branchNameMap,
      currentBranchId,
      selectedBranchName,
      selectedTable?.branchName
    ),
    zoneName: resolveZoneName(selectedTableDetail, zoneNameMap, selectedTable?.zoneName),
  };
};
