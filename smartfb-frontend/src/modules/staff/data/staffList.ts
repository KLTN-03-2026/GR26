import { StaffStatus, StaffShiftType } from '../types/staff.types';

/**
 * Extended staff data với đầy đủ thông tin cho trang Staff Manager
 * Dựa trên Module 4 Spec
 */
export interface StaffDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: StaffStatus;
  positionId: string;
  positionName: string;
  branchId: string;
  branchName: string;
  hireDate: string;
  shiftType: StaffShiftType;
  attendanceRate: number;
  salary: number;
}

/**
 * Mock data cho bảng danh sách nhân viên
 */
export const mockStaffList: StaffDetail[] = [
  {
    id: 'staff-1',
    fullName: 'Lê Văn Nam',
    email: 'nam.lv@smartfb.vn',
    phone: '0901234567',
    status: 'active',
    positionId: 'pos-1',
    positionName: 'Quản lý',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-01-15',
    shiftType: 'full-time',
    attendanceRate: 98,
    salary: 15000000,
  },
  {
    id: 'staff-2',
    fullName: 'Trần Minh Thư',
    email: 'thu.tm@smartfb.vn',
    phone: '0901234568',
    status: 'active',
    positionId: 'pos-2',
    positionName: 'Phục vụ',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-03-01',
    shiftType: 'full-time',
    attendanceRate: 95,
    salary: 7000000,
  },
  {
    id: 'staff-3',
    fullName: 'Phạm Tuấn Kiệt',
    email: 'kiet.pt@smartfb.vn',
    phone: '0901234569',
    status: 'active',
    positionId: 'pos-3',
    positionName: 'Đầu bếp',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2023-06-20',
    shiftType: 'full-time',
    attendanceRate: 92,
    salary: 12000000,
  },
  {
    id: 'staff-4',
    fullName: 'Nguyễn Phương Linh',
    email: 'linh.np@smartfb.vn',
    phone: '0901234570',
    status: 'active',
    positionId: 'pos-4',
    positionName: 'Thu ngân',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-02-10',
    shiftType: 'full-time',
    attendanceRate: 96,
    salary: 8000000,
  },
  {
    id: 'staff-5',
    fullName: 'Vũ Gia Huy',
    email: 'huy.vg@smartfb.vn',
    phone: '0901234571',
    status: 'active',
    positionId: 'pos-2',
    positionName: 'Phục vụ',
    branchId: 'branch-1',
    branchName: 'Chi nhánh Quận 1',
    hireDate: '2024-04-15',
    shiftType: 'part-time',
    attendanceRate: 88,
    salary: 5000000,
  },
];
