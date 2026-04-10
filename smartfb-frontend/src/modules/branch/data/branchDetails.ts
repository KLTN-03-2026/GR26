/**
 * Extended branch data với đầy đủ thông tin cho trang Branch Manager
 */
export interface BranchDetail {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  revenue: number;
  staff: number;
  location: string;
  openTime: string;
  closeTime: string;
}

/**
 * Mock data cho bảng danh sách chi nhánh
 */
export const mockBranchDetails: BranchDetail[] = [
  {
    id: 'branch-1',
    name: 'ChuCha',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234567',
    status: 'active',
    revenue: 8200000,
    staff: 6,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
  {
    id: 'branch-2',
    name: 'NooShan',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234568',
    status: 'active',
    revenue: 5400000,
    staff: 4,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
  {
    id: 'branch-3',
    name: 'Kame',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234569',
    status: 'active',
    revenue: 4100000,
    staff: 5,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
  {
    id: 'branch-4',
    name: 'Chuma',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234570',
    status: 'active',
    revenue: 7800000,
    staff: 6,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
  {
    id: 'branch-5',
    name: 'Kameha',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234571',
    status: 'inactive',
    revenue: 0,
    staff: 0,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
  {
    id: 'branch-6',
    name: 'Kameha',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234571',
    status: 'inactive',
    revenue: 0,
    staff: 0,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
  {
    id: 'branch-7',
    name: 'Kameha',
    address: '12 Mạc Định Chi, Đa...',
    phone: '0901234571',
    status: 'inactive',
    revenue: 0,
    staff: 0,
    location: 'TP. Hồ Chí Minh',
    openTime: '09:00',
    closeTime: '22:00',
  },
];
