/**
 * Mock data chi tiết chi nhánh cho trang Branch Detail
 */

export interface BranchManager {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface BranchDetailFull {
  id: string;
  code: string;
  name: string;
  taxCode: string;
  countStaff:number;
  address: string;
  city: string;
  phone: string;
  openTime: string;
  closeTime: string;
  coverImage?: string;
  manager: BranchManager;
  status: 'active' | 'inactive';
  isOpened: boolean;
  revenue: number;
  staffCount: number;
  createdAt: string;
}

export const branchDetailMock: BranchDetailFull = {
  id: 'branch-1',
  code: 'BR-Q1-TXO1',
  name: 'ChuCha',
  taxCode: '23231241241234125',
  countStaff : 12,
  address: '266 Nguyễn Hoàng, Hải Châu',
  city: 'TP.Đà Nẵng',
  phone: '028 3930 4567',
  openTime: '07:00',
  closeTime: '22:30',
  coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=400&fit=crop',
  manager: {
    id: 'manager-1',
    name: 'Lê Văn Nam',
    avatar: 'https://i.pravatar.cc/150?u=manager-1',
    phone: '0901234567',
    email: 'nam.lv@smartfb.vn',
  },
  status: 'active',
  isOpened: true,
  revenue: 8200000,
  staffCount: 6,
  createdAt: '2025-01-15T08:00:00Z',
};
