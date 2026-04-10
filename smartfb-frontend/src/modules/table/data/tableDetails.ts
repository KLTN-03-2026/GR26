/**
 * Extended table data với đầy đủ thông tin cho trang Table Manager
 */
export interface TableDetail {
  id: string;
  name: string;
  areaId: string;
  areaName: string;
  capacity: number;
  branchId: string;
  branchName: string;
  status: 'active' | 'inactive';
  usageStatus: 'available' | 'occupied' | 'unpaid' | 'reserved';
  createdAt: string;
  updatedAt: string;
  description?: string;
}

/**
 * Mock data cho danh sách bàn
 */
export const mockTableDetails: TableDetail[] = [
  // Chi nhánh ChuCha - Tầng 1
  {
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
  },
  {
    id: 'table-2',
    name: 'Bàn 02',
    areaId: 'area-1',
    areaName: 'Tầng 1',
    capacity: 4,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'occupied',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-3',
    name: 'Bàn 03',
    areaId: 'area-1',
    areaName: 'Tầng 1',
    capacity: 6,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'unpaid',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-4',
    name: 'VIP 01',
    areaId: 'area-4',
    areaName: 'Phòng VIP',
    capacity: 8,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'reserved',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-5',
    name: 'Bàn 21',
    areaId: 'area-2',
    areaName: 'Tầng 2',
    capacity: 4,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'available',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-6',
    name: 'Bàn 22',
    areaId: 'area-2',
    areaName: 'Tầng 2',
    capacity: 6,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'available',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-7',
    name: 'Sân 01',
    areaId: 'area-3',
    areaName: 'Sân vườn',
    capacity: 4,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'occupied',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-8',
    name: 'Sân 02',
    areaId: 'area-3',
    areaName: 'Sân vườn',
    capacity: 6,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'active',
    usageStatus: 'available',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'table-9',
    name: 'Bàn 01',
    areaId: 'area-1',
    areaName: 'Tầng 1',
    capacity: 4,
    branchId: 'branch-2',
    branchName: 'NooShan',
    status: 'active',
    usageStatus: 'available',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'table-10',
    name: 'Bàn 02',
    areaId: 'area-1',
    areaName: 'Tầng 1',
    capacity: 4,
    branchId: 'branch-2',
    branchName: 'NooShan',
    status: 'active',
    usageStatus: 'available',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'table-11',
    name: 'VIP 01',
    areaId: 'area-4',
    areaName: 'Phòng VIP',
    capacity: 10,
    branchId: 'branch-2',
    branchName: 'NooShan',
    status: 'active',
    usageStatus: 'available',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'table-12',
    name: 'Bàn 03',
    areaId: 'area-1',
    areaName: 'Tầng 1',
    capacity: 4,
    branchId: 'branch-1',
    branchName: 'ChuCha',
    status: 'inactive',
    usageStatus: 'available',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
];

/**
 * Mock data cho danh sách khu vực bàn
 */
export const mockTableAreas = [
  { id: 'area-1', name: 'Tầng 1' },
  { id: 'area-2', name: 'Tầng 2' },
  { id: 'area-3', name: 'Sân vườn' },
  { id: 'area-4', name: 'Phòng VIP' },
];