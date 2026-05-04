import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  CogsReportItem,
  CogsReportItemResponse,
  CogsReportParams,
  ExpiringItemReport,
  ExpiringItemReportResponse,
  ExpiringItemsReportParams,
  InventoryMovementReportItem,
  InventoryMovementReportItemResponse,
  InventoryMovementReportParams,
  InventoryStockReportItem,
  InventoryStockReportItemResponse,
  InventoryStockReportParams,
  InventoryWasteReportParams,
  ReportPageResponse,
  WasteReportItem,
  WasteReportItemResponse,
} from '../types/report.types';
import { normalizeReportNumber } from '../types/report.types';

const mapPageResponse = <TResponse, TMapped>(
  page: ReportPageResponse<TResponse>,
  mapper: (item: TResponse) => TMapped,
): ReportPageResponse<TMapped> => ({
  ...page,
  content: page.content.map(mapper),
});

const mapInventoryStockItem = (
  item: InventoryStockReportItemResponse,
): InventoryStockReportItem => ({
  ...item,
  currentQty: item.currentQty ?? 0,
  minLevel: item.minLevel ?? 0,
  unitCost: normalizeReportNumber(item.unitCost),
  totalValue: normalizeReportNumber(item.totalValue),
});

const mapExpiringItem = (item: ExpiringItemReportResponse): ExpiringItemReport => ({
  ...item,
  quantityRemaining: item.quantityRemaining ?? 0,
  unitCost: normalizeReportNumber(item.unitCost),
  daysToExpire: item.daysToExpire ?? 0,
});

const mapWasteItem = (item: WasteReportItemResponse): WasteReportItem => ({
  ...item,
  totalWasteQty: item.totalWasteQty ?? 0,
  totalWasteCost: normalizeReportNumber(item.totalWasteCost),
  wastePercentage: normalizeReportNumber(item.wastePercentage),
  reasonCount: item.reasonCount ?? 0,
});

/**
 * Hook lấy báo cáo tồn kho hiện tại cho một chi nhánh.
 *
 * @param params - Chi nhánh và phân trang cần xem
 */
export const useInventoryStockReport = (params?: InventoryStockReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.inventoryStock(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số báo cáo tồn kho');
      }

      const response = await reportService.getInventoryStockReport(params);
      return mapPageResponse(response.data, mapInventoryStockItem);
    },
    enabled: Boolean(params?.branchId),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy danh sách lô hàng sắp hết hạn của một chi nhánh.
 *
 * @param params - Chi nhánh, ngưỡng ngày và phân trang cần xem
 */
export const useExpiringItemsReport = (params?: ExpiringItemsReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.inventoryExpiring(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số báo cáo hàng sắp hết hạn');
      }

      const response = await reportService.getExpiringItemsReport(params);
      return mapPageResponse(response.data, mapExpiringItem);
    },
    enabled: Boolean(params?.branchId),
    staleTime: 60 * 1000,
  });
};

const mapInventoryMovementItem = (
  item: InventoryMovementReportItemResponse,
): InventoryMovementReportItem => ({
  ...item,
  beginningBalance: item.beginningBalance ?? 0,
  importQty: item.importQty ?? 0,
  exportQty: item.exportQty ?? 0,
  endingBalance: item.endingBalance ?? 0,
  beginningValue: normalizeReportNumber(item.beginningValue),
  importValue: normalizeReportNumber(item.importValue),
  exportValue: normalizeReportNumber(item.exportValue),
  endingValue: normalizeReportNumber(item.endingValue),
  variance: item.variance ?? 0,
});

const mapCogsItem = (item: CogsReportItemResponse): CogsReportItem => ({
  ...item,
  qtyUsed: item.qtyUsed ?? 0,
  unitCost: normalizeReportNumber(item.unitCost),
  totalCost: normalizeReportNumber(item.totalCost),
});

/**
 * Hook lấy báo cáo biến động kho: Nhập/Xuất/Tồn đầu kỳ → cuối kỳ.
 *
 * @param params - Chi nhánh, khoảng ngày và cách nhóm (daily/weekly/monthly)
 */
export const useInventoryMovementReport = (params?: InventoryMovementReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.inventoryMovement(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) throw new Error('Thiếu tham số báo cáo biến động kho');
      const response = await reportService.getInventoryMovementReport(params);
      return mapPageResponse(response.data, mapInventoryMovementItem);
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy báo cáo giá vốn hàng bán (COGS) theo phương pháp FIFO.
 *
 * @param params - Chi nhánh và khoảng ngày cần xem
 */
export const useCogsReport = (params?: CogsReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.inventoryCogs(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) throw new Error('Thiếu tham số báo cáo COGS');
      const response = await reportService.getCogsReport(params);
      return mapPageResponse(response.data, mapCogsItem);
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy báo cáo hao hụt nguyên liệu trong khoảng ngày.
 *
 * @param params - Chi nhánh và khoảng ngày cần xem
 */
export const useWasteReport = (params?: InventoryWasteReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.inventoryWaste(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số báo cáo hao hụt');
      }

      const response = await reportService.getWasteReport(params);
      return response.data.map(mapWasteItem);
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};
