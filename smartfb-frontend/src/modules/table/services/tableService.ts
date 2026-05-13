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
 * Chuẩn hóa dữ liệu table từ backend sang model thẻ gọi khách ở FE.
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
 * Chuẩn hóa dữ liệu zone từ backend sang model máy gọi thẻ ở FE.
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
   * Lấy danh sách thẻ gọi khách - GET /branches/{branchId}/tables
   * API trả về ApiResponse<List<TableResponse>>
   */
  getList: async (): Promise<TableItem[]> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<BackendTableResponse[]>>(
      `/branches/${branchId}/tables`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể tải danh sách thẻ gọi khách');
    }

    return (response.data.data || []).map((item: BackendTableResponse) =>
      mapTableResponse(item, branchId)
    );
  },

  /**
   * Lấy chi tiết thẻ gọi khách - GET /branches/{branchId}/tables/{tableId}
   */
  getById: async (id: string): Promise<TableItem> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<BackendTableResponse>>(
      `/branches/${branchId}/tables/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không tìm thấy thẻ gọi khách');
    }

    const item = response.data.data;

    return mapTableResponse(item, branchId);
  },

  /**
   * Tạo thẻ gọi khách mới - POST /branches/{branchId}/tables
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
      throw new Error(response.data.error?.message || 'Không thể tạo thẻ mới');
    }

    const item = response.data.data;

    return mapTableResponse(item, branchId);
  },

  /**
   * Cập nhật thẻ gọi khách - PUT /branches/{branchId}/tables/{tableId}
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
      throw new Error(response.data.error?.message || 'Không thể cập nhật thẻ');
    }

    const item = response.data.data;

    return mapTableResponse(item, branchId);
  },

  /**
   * Xóa thẻ gọi khách (soft delete) - DELETE /branches/{branchId}/tables/{tableId}
   */
  delete: async (id: string): Promise<void> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/branches/${branchId}/tables/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể xóa thẻ');
    }
  },

  /**
   * Batch update vị trí thẻ - PUT /branches/{branchId}/tables/positions
   * WebSocket broadcast tự động
   */
  batchUpdatePositions: async (positions: BatchUpdatePositionsPayload): Promise<void> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.put<ApiResponse<void>>(
      `/branches/${branchId}/tables/positions`,
      positions
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể cập nhật vị trí thẻ');
    }
  },

  /**
   * Lấy danh sách máy gọi thẻ - GET /branches/{branchId}/zones
   * API trả về ApiResponse<List<TableZoneResponse>>
   */
  getZones: async (): Promise<TableArea[]> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<BackendZoneResponse[]>>(
      `/branches/${branchId}/zones`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể tải danh sách máy gọi thẻ');
    }

    return (response.data.data || []).map(mapZoneResponse);
  },

  /**
   * Tạo máy gọi thẻ mới - POST /branches/{branchId}/zones
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
      throw new Error(response.data.error?.message || 'Không thể tạo máy gọi thẻ');
    }

    return mapZoneResponse(response.data.data);
  },

  /**
   * Cập nhật máy gọi thẻ - PUT /branches/{branchId}/zones/{zoneId}
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
      throw new Error(response.data.error?.message || 'Không thể cập nhật máy gọi thẻ');
    }

    return mapZoneResponse(response.data.data);
  },

  /**
   * Xóa máy gọi thẻ - DELETE /branches/{branchId}/zones/{zoneId}
   */
  deleteZone: async (id: string): Promise<void> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/branches/${branchId}/zones/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể xóa máy gọi thẻ');
    }
  },

  /**
   * Lấy số thẻ đang giao khách - GET /branches/{branchId}/tables/stats/occupied-count
   */
  getOccupiedCount: async (): Promise<number> => {
    const branchId = getCurrentBranchId();
    const response = await axiosInstance.get<ApiResponse<number>>(
      `/branches/${branchId}/tables/stats/occupied-count`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Không thể lấy số thẻ đang giao khách');
    }

    return response.data.data ?? 0;
  },
};
