/**
 * Extended staff data với đầy đủ thông tin cho trang Staff Manager
 */
export interface StaffDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  role: 'manager' | 'chef' | 'waiter' | 'cashier' | 'staff';
  department: 'Quản lý' | 'Phục vụ' | 'Bếp' | 'Tính tiền' | 'Khác';
  branchId: string;
  branchName: string;
  hireDate: string;
  shiftType: 'full-time' | 'part-time';
  attendanceRate: number;
  salary: number;
}

/**
 * Mock data cho bảng danh sách nhân viên
 */
export const mockStaffList: StaffDetail[] = [
  {
    id: 'staff-1',
    firstName: 'Lê',
    lastName: 'Văn Nam',
    email: 'nam.lv@smartfb.vn',
    phone: '0901234567',
    status: 'active',
    role: 'manager',
    department: 'Quản lý',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-01-15',
    shiftType: 'full-time',
    attendanceRate: 98,
    salary: 15000000,
  },
  {
    id: 'staff-2',
    firstName: 'Trần',
    lastName: 'Minh Thư',
    email: 'thu.tm@smartfb.vn',
    phone: '0901234568',
    status: 'active',
    role: 'waiter',
    department: 'Phục vụ',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-03-01',
    shiftType: 'full-time',
    attendanceRate: 95,
    salary: 7000000,
  },
  {
    id: 'staff-3',
    firstName: 'Phạm',
    lastName: 'Tuấn Kiệt',
    email: 'kiet.pt@smartfb.vn',
    phone: '0901234569',
    status: 'active',
    role: 'chef',
    department: 'Bếp',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2023-06-20',
    shiftType: 'full-time',
    attendanceRate: 92,
    salary: 12000000,
  },
  {
    id: 'staff-4',
    firstName: 'Nguyễn',
    lastName: 'Phương Linh',
    email: 'linh.np@smartfb.vn',
    phone: '0901234570',
    status: 'active',
    role: 'cashier',
    department: 'Tính tiền',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-02-10',
    shiftType: 'full-time',
    attendanceRate: 96,
    salary: 8000000,
  },
  {
    id: 'staff-5',
    firstName: 'Vũ',
    lastName: 'Gia Huy',
    email: 'huy.vg@smartfb.vn',
    phone: '0901234571',
    status: 'active',
    role: 'waiter',
    department: 'Phục vụ',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-04-15',
    shiftType: 'part-time',
    attendanceRate: 88,
    salary: 5000000,
  },
  {
    id: 'staff-6',
    firstName: 'Phan',
    lastName: 'Khánh Vy',
    email: 'vy.pk@smartfb.vn',
    phone: '0901234572',
    status: 'inactive',
    role: 'waiter',
    department: 'Phục vụ',
    branchId: 'branch-2',
    branchName: 'Chi nhánh Quận 3',
    hireDate: '2023-12-01',
    shiftType: 'part-time',
    attendanceRate: 0,
    salary: 5000000,
  },
  {
    id: 'staff-7',
    firstName: 'Đặng',
    lastName: 'Thiên Phú',
    email: 'phu.dt@smartfb.vn',
    phone: '0901234573',
    status: 'active',
    role: 'chef',
    department: 'Bếp',
    branchId: 'branch-2',
    branchName: 'Chi nhánh Quận 3',
    hireDate: '2023-09-05',
    shiftType: 'full-time',
    attendanceRate: 94,
    salary: 13000000,
  },
];
