/**
 * Types cho module Staff Management
 * Dựa trên đặc tả Module 4: Quản lý Nhân sự (Staff & Role)
 */

export type StaffStatus = 'active' | 'inactive';
export type StaffShiftType = 'full-time' | 'part-time';

/**
 * Filter cho danh sách nhân viên
 */
export type StaffFilters = {
  search: string;
  status: StaffStatus | 'all';
  positionId: string | 'all';
  branchId: string | 'all';
};

export type StaffListItem = {
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
  salaryDisplay: string;
  posPin?: string;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

// Form data types
export type CreateStaffFormData = {
  fullName: string;
  email: string;
  phone: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  branchId: string;
  positionId: string;
  shiftType: StaffShiftType;
  salary: number;
  hireDate: string;
  posPin: string;
  status: StaffStatus;
};

export type EditStaffFormData = {
  fullName: string;
  email: string;
  phone: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  positionId: string;
  salary: number;
  shiftType: StaffShiftType;
  status: StaffStatus;
};