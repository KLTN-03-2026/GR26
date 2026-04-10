/**
 * Mock data chi tiết nhân viên cho trang Staff Detail
 */

export interface Manager {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface StaffDetailFull {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  status: 'active' | 'inactive';
  role: 'manager' | 'chef' | 'waiter' | 'cashier' | 'staff';
  department: 'Quản lý' | 'Phục vụ' | 'Bếp' | 'Tính tiền' | 'Khác';
  branchId: string;
  branchName: string;
  shiftType: 'full-time' | 'part-time';
  hireDate: string;
  salary: number;
  attendanceRate: number;
  pinPos?: string;
  accountNumber?: string;
  manager?: Manager;
  avatar?: string;
  createdAt: string;
}

export const staffDetailMock: StaffDetailFull = {
  id: 'staff-1',
  firstName: 'Lê',
  lastName: 'Văn Nam',
  email: 'nam.lv@smartfb.vn',
  phone: '0901234567',
  identityId: '123456789012',
  dateOfBirth: '1995-05-20',
  address: '266 Nguyễn Hoàng, Hải Châu',
  city: 'TP.Đà Nẵng',
  status: 'active',
  role: 'manager',
  department: 'Quản lý',
  branchId: 'branch-1',
  branchName: 'Chi nhánh Quận 1',
  shiftType: 'full-time',
  hireDate: '2024-01-15',
  salary: 15000000,
  attendanceRate: 98,
  pinPos: '1234',
  accountNumber: '1011234567890',
  manager: {
    id: 'manager-1',
    name: 'Trần Văn Hoàng',
    avatar: 'https://i.pravatar.cc/150?u=manager-1',
    phone: '0901234500',
    email: 'hoang.tv@smartfb.vn',
  },
  avatar: 'https://i.pravatar.cc/150?u=staff-1',
  createdAt: '2024-01-15T08:00:00Z',
};
