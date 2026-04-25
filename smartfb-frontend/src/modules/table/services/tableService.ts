import { axiosInstance } from '@lib/axios';
import { useAuthStore } from '@modules/auth/stores/authStore';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  TableItem,
  CreateTablePayload,
  UpdateTablePayload,
  TableArea,
  BatchUpdatePositionsPayload,
  CreateZonePayload,
  TableShape,
  UpdateZonePayload,
} from '../types/table.types';

// Type response từ backend cho TableResponse
interface BackendTableResponse {
  id: string;
  branchId: string;
  zoneId: string;
  name: string;
  capacity: number;
  status: string;        // 'OCCUPIED', 'RESERVED', 'UNPAID', 'FREE'
  positionX: number;
  positionY: number;
  shape: TableShape;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Type response từ backend cho TableZoneResponse
interface BackendZoneResponse {
  id: string;
  branchId: string;
  name: string;
  floorNumber: number;
}

interface UpdateTableRequestBody {
  name: string;
  zoneId: string;
  capacity: number;
  shape?: TableShape;
  isActive?: boolean;
}

/**
 * Chuẩn hóa dữ liệu bàn từ backend sang model FE.
 */
const mapTableResponse = (item: BackendTableResponse, branchId: string): TableItem => ({
  id: item.id,
  name: item.name,
  zoneId: item.zoneId,
  zoneName: '',
  capacity: item.capacity,
  branchId: item.branchId || branchId,
  branchName: '',
  status: item.isActive === false ? 'inactive' : 'active',
  usageStatus: mapUsageStatus(item.status),
  positionX: item.positionX || 0,
  positionY: item.positionY || 0,
  shape: item.shape || 'square',
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString(),
});

/**
 * Chuẩn hóa dữ liệu khu vực từ backend sang model FE.
 */
const mapZoneResponse = (zone: BackendZoneResponse): TableArea => ({
  id: zone.id,
  branchId: zone.branchId,
  name: zone.name,
  floorNumber: zone.floorNumber,
});

/**
 * Lấy branchId hiện tại từ auth store
 */
const getCurrentBranchId = (): string => {
  const { user, session } = useAuthStore.getState();
  const branchId = user?.branchId || session?.branchId;

  if (!branchId) {
    throw new Error('Chưa chọn chi nhánh. Vui lòng chọn chi nhánh làm việc.');
  }

  return branchId;
};

/**
 * Map backend status -> usageStatus
 */
const mapUsageStatus = (backendStatus: string): TableItem['usageStatus'] => {
  switch (backendStatus) {
    case 'OCCUPIED': return 'occupied';
    case 'RESERVED': return 'reserved';
    case 'UNPAID': return 'unpaid';
    default: return 'available';
  }
};

export const tableService = {
  /**
   * Lấy danh sách bàn - GET /branches/{branchId}/tables
   * API trả về ApiResponse<List<TableResponse>>
   */
  getList: async (): Promise<TableItem[]> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<BackendTableResponse[]>>(
      `/branches/${branchId}/tables`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể tải danh sách bàn');
    }

    return (response.data.data || []).map((item: BackendTableResponse) =>
      mapTableResponse(item, branchId)
    );
  },

  /**
   * Lấy chi tiết bàn - GET /branches/{branchId}/tables/{tableId}
   */
  getById: async (id: string): Promise<TableItem> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<BackendTableResponse>>(
      `/branches/${branchId}/tables/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không tìm thấy bàn');
    }

    const item = response.data.data;

    return mapTableResponse(item, branchId);
  },

  /**
   * Tạo bàn mới - POST /branches/{branchId}/tables
   * Body theo CreateTableRequest: { zoneId, name, capacity, shape }
   */
  create: async (payload: CreateTablePayload): Promise<TableItem> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.post<ApiResponse<BackendTableResponse>>(
      `/branches/${branchId}/tables`,
      {
        zoneId: payload.zoneId,
        name: payload.name,
        capacity: payload.capacity,
        shape: payload.shape || 'square',
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể tạo bàn mới');
    }

    const item = response.data.data;

    return mapTableResponse(item, branchId);
  },

  /**
   * Cập nhật bàn - PUT /branches/{branchId}/tables/{tableId}
   * Body theo UpdateTableRequest: { name, zoneId, capacity, shape, isActive }
   */
  update: async (id: string, payload: UpdateTablePayload): Promise<TableItem> => {
    const branchId = getCurrentBranchId();
    const updateBody: UpdateTableRequestBody = {
      name: payload.name,
      zoneId: payload.zoneId,
      capacity: payload.capacity,
    };

    if (payload.shape) updateBody.shape = payload.shape;
    if (payload.isActive !== undefined) updateBody.isActive = payload.isActive;

    const response = await axiosInstance.put<ApiResponse<BackendTableResponse>>(
      `/branches/${branchId}/tables/${id}`,
      updateBody
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể cập nhật bàn');
    }

    const item = response.data.data;

    return mapTableResponse(item, branchId);
  },

  /**
   * Xóa bàn (soft delete) - DELETE /branches/{branchId}/tables/{tableId}
   */
  delete: async (id: string): Promise<void> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/branches/${branchId}/tables/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể xóa bàn');
    }
  },

  /**
   * Batch update vị trí bàn (Drag & Drop) - PUT /branches/{branchId}/tables/positions
   * WebSocket broadcast tự động
   */
  batchUpdatePositions: async (positions: BatchUpdatePositionsPayload): Promise<void> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.put<ApiResponse<void>>(
      `/branches/${branchId}/tables/positions`,
      positions
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể cập nhật vị trí bàn');
    }
  },

  /**
   * Lấy danh sách khu vực - GET /branches/{branchId}/zones
   * API trả về ApiResponse<List<TableZoneResponse>>
   */
  getZones: async (): Promise<TableArea[]> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<BackendZoneResponse[]>>(
      `/branches/${branchId}/zones`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể tải danh sách khu vực');
    }

    return (response.data.data || []).map(mapZoneResponse);
  },

  /**
   * Tạo khu vực mới - POST /branches/{branchId}/zones
   * Body theo CreateTableZoneRequest: { name, floorNumber }
   */
  createZone: async (payload: CreateZonePayload): Promise<TableArea> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.post<ApiResponse<BackendZoneResponse>>(
      `/branches/${branchId}/zones`,
      {
        name: payload.name,
        floorNumber: payload.floorNumber,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể tạo khu vực');
    }

    return mapZoneResponse(response.data.data);
  },

  /**
   * Cập nhật khu vực - PUT /branches/{branchId}/zones/{zoneId}
   * Body theo UpdateTableZoneRequest: { name, floorNumber }
   */
  updateZone: async (id: string, payload: UpdateZonePayload): Promise<TableArea> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.put<ApiResponse<BackendZoneResponse>>(
      `/branches/${branchId}/zones/${id}`,
      {
        name: payload.name,
        floorNumber: payload.floorNumber,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể cập nhật khu vực');
    }

    return mapZoneResponse(response.data.data);
  },

  /**
   * Xóa khu vực - DELETE /branches/{branchId}/zones/{zoneId}
   */
  deleteZone: async (id: string): Promise<void> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/branches/${branchId}/zones/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể xóa khu vực');
    }
  },

  /**
   * Lấy số bàn đang có khách - GET /branches/{branchId}/tables/stats/occupied-count
   */
  getOccupiedCount: async (): Promise<number> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<number>>(
      `/branches/${branchId}/tables/stats/occupied-count`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể lấy số bàn đang có khách');
    }

    return response.data.data ?? 0;
  },
};
