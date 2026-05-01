import type { TableDetail } from '../data/tableDetails';
import type { CreateTablePayload, UpdateTablePayload } from '../types/table.types';
import type { ApiResponse } from '@shared/types/api.types';

// Import mock data
import { mockTableDetails, mockTableAreas } from '../data/tableDetails';
import { tableDetailMock } from '../data/tableDetailMock';

export const tableService = {
  getList: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTableDetails;
  },

  getById: async (id: string): Promise<ApiResponse<TableDetail>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (id === tableDetailMock.id) {
      return { success: true, data: tableDetailMock };
    }

    throw new Error('Không tìm thấy bàn');
  },

  create: async (payload: CreateTablePayload): Promise<ApiResponse<TableDetail>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const existingTable = mockTableDetails.find(
      table =>
        table.name.toLowerCase() === payload.name.toLowerCase() &&
        table.areaId === payload.areaId &&
        table.branchId === payload.branchId
    );

    if (existingTable) {
      throw new Error(`Tên bàn "${payload.name}" đã tồn tại trong khu vực này`);
    }

    const area = mockTableAreas.find(a => a.id === payload.areaId);
    const branch = mockTableDetails.find(b => b.branchId === payload.branchId);

    const newTable: TableDetail = {
      id: `table-${Date.now()}`,
      name: payload.name,
      areaId: payload.areaId,
      areaName: area?.name || 'Unknown',
      capacity: payload.capacity,
      branchId: payload.branchId,
      branchName: branch?.branchName || 'Unknown',
      status: 'active',
      usageStatus: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: payload.description,
    };

    mockTableDetails.push(newTable);
    return { success: true, data: newTable };
  },

  update: async (id: string, payload: UpdateTablePayload): Promise<ApiResponse<TableDetail>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const existingTable = mockTableDetails.find(
      table =>
        table.id !== id &&
        table.name.toLowerCase() === payload.name.toLowerCase() &&
        table.areaId === payload.areaId &&
        table.branchId === payload.branchId
    );

    if (existingTable) {
      throw new Error(`Tên bàn "${payload.name}" đã tồn tại trong khu vực này`);
    }

    const index = mockTableDetails.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy bàn để cập nhật');
    }

    const existingTableData = mockTableDetails[index];
    const area = mockTableAreas.find(a => a.id === payload.areaId);
    const branch = mockTableDetails.find(b => b.branchId === payload.branchId);

    const updatedTable: TableDetail = {
      ...existingTableData,
      id,
      name: payload.name,
      areaId: payload.areaId,
      areaName: area?.name || existingTableData.areaName,
      capacity: payload.capacity,
      branchId: payload.branchId,
      branchName: branch?.branchName || existingTableData.branchName,
      status: payload.status || existingTableData.status,
      updatedAt: new Date().toISOString(),
      description: payload.description,
    };

    mockTableDetails[index] = updatedTable;
    return { success: true, data: updatedTable };
  },

  toggleStatus: async (id: string): Promise<ApiResponse<TableDetail>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = mockTableDetails.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy bàn');
    }

    const updatedTable: TableDetail = {
      ...mockTableDetails[index],
      status: mockTableDetails[index].status === 'active' ? 'inactive' : 'active',
      updatedAt: new Date().toISOString(),
    };

    mockTableDetails[index] = updatedTable;
    return { success: true, data: updatedTable };
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = mockTableDetails.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy bàn');
    }

    const table = mockTableDetails[index];

    if (table.usageStatus === 'occupied') {
      throw new Error('Không thể xóa bàn đang có khách ngồi');
    }

    if (table.usageStatus === 'unpaid') {
      throw new Error('Không thể xóa bàn có đơn hàng chưa thanh toán');
    }

    mockTableDetails.splice(index, 1);
    return { success: true, data: true };
  },
};