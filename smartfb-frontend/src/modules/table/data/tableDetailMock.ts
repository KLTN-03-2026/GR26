import type { TableDetail } from './tableDetails';

/**
 * Mock data chi tiết cho một bàn cụ thể
 * Dùng để test getById và update operations
 */
export const tableDetailMock: TableDetail = {
  id: 'table-1',
  name: 'Bàn 01',
  areaId: 'area-1',
  areaName: 'Tầng 1',
  capacity: 4,
  branchId: 'branch-1',
  branchName: 'ChuCha',
  status: 'active',
  usageStatus: 'available',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  description: 'Bàn góc view đẹp, gần cửa sổ',
};