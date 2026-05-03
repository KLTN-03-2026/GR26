/**
 * Types cho module Staff Management
 */

export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type StaffGender = 'MALE' | 'FEMALE' | 'OTHER';

// Filter cho danh sách nhân viên
export type StaffFilters = {
  keyword?: string;
  status?: StaffStatus;
  positionId?: string;
  page?: number;
  size?: number;
};

// Response từ API - Danh sách nhân viên (theo StaffSummaryResult API)
export interface StaffSummary {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  employeeCode: string;
  status: StaffStatus;
  positionId: string;
  positionName: string;
  hireDate: string;
  createdAt: string;
  roles: string[];
}

// Response từ API - Chi tiết nhân viên (theo StaffDetailResult API)
export interface StaffDetail {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  employeeCode: string;
  status: StaffStatus;
  gender: StaffGender;
  address: string;
  avatarUrl: string;
  dateOfBirth: string;
  hireDate: string;
  positionId: string;
  positionName: string;
  createdAt: string;
  roles: RoleInfo[];
}

export interface RoleInfo {
  id: string;
  name: string;
}

//CreateStaffRequest theo API spec
export interface CreateStaffRequest {
  fullName: string;      // required
  phone: string;         // required (pattern: ^[0-9]{9,11}$)
  email?: string;
  positionId?: string;   // UUID
  employeeCode?: string; // max 50 chars
  hireDate?: string;     // format: date (YYYY-MM-DD)
  dateOfBirth?: string;  // format: date (YYYY-MM-DD)
  gender?: StaffGender;  // MALE, FEMALE, OTHER
  address?: string;
  password?: string;
  posPin?: string;
}

// UpdateStaffRequest theo API spec
export interface UpdateStaffRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  positionId?: string;
  employeeCode?: string;
  hireDate?: string;
  dateOfBirth?: string;
  gender?: StaffGender;
  address?: string;
}

//DeactivateStaffRequest theo API spec
export interface DeactivateStaffRequest {
  reason: string;  // max 500 chars
}

// Request đổi trạng thái khóa/mở khóa nhân viên, bắt buộc có lý do để backend ghi audit trail.
export interface UpdateStaffStatusRequest {
  status: StaffStatus;
  reason: string;
}

// UI Types
export interface StaffListItem {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: StaffStatus;
  positionName: string;
  employeeCode: string;
  hireDate: string;
}

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

export type CreateStaffFormData = {
  fullName: string;
  phone: string;
  email: string;
  employeeCode: string;
  hireDate: string;
  positionId?: string;
  dateOfBirth?: string;
  gender?: StaffGender;
  address?: string;
};

export type EditStaffFormData = {
  fullName: string;
  phone: string;
  email: string;
  employeeCode: string;
  hireDate: string;
  positionId?: string;
  dateOfBirth?: string;
  gender?: StaffGender;
  address?: string;
};
