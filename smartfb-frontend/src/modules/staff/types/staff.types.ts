/**
 * Types cho module Staff Management
 * Dựa trên đặc tả PB08 - Quản lý nhân viên
 */

export type StaffStatus = 'active' | 'inactive';
export type StaffRole = 'manager' | 'chef' | 'waiter' | 'cashier' | 'staff';
export type StaffDepartment = 'Quản lý' | 'Phục vụ' | 'Bếp' | 'Tính tiền' | 'Khác';
export type StaffShiftType = 'full-time' | 'part-time';

/**
 * Filter cho danh sách nhân viên (PB09)
 */
export type StaffFilters = {
  search: string;
  status: StaffStatus | 'all';
  role: StaffRole | 'all';
  branchId: string | 'all';
};

export type StaffListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: StaffStatus;
  role: StaffRole;
  department: StaffDepartment;
  branchId: string;
  branchName: string;
  hireDate: string;
  shiftType: StaffShiftType;
  attendanceRate: number;
  salary: number;
  salaryDisplay: string;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

// Form data types
export type CreateStaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  branchId: string;
  branchName: string;
  role: StaffRole;
  department: StaffDepartment;
  shiftType: StaffShiftType;
  salary: number;
  hireDate: string;
  pinPos: string;
  status: StaffStatus;
};

// EditStaffFormData - chỉ giữ các field cần thiết
export type EditStaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  role: StaffRole;
  department: StaffDepartment;
  salary: number;
  shiftType: StaffShiftType;
};