import { z } from 'zod';

// Định nghĩa enum values
const STAFF_ROLES = ['manager', 'chef', 'waiter', 'cashier', 'staff'] as const;
const DEPARTMENTS = ['Quản lý', 'Phục vụ', 'Bếp', 'Tính tiền', 'Khác'] as const;
const SHIFT_TYPES = ['full-time', 'part-time'] as const;
const STATUSES = ['active', 'inactive'] as const;

// Type định nghĩa từ enum values
export type StaffRoleType = typeof STAFF_ROLES[number];
export type DepartmentType = typeof DEPARTMENTS[number];
export type ShiftType = typeof SHIFT_TYPES[number];
export type StatusType = typeof STATUSES[number];

/**
 * Validation schemas cho form nhân viên
 * Đáp ứng PB08: Kiểm tra dữ liệu đầu vào
 */

// Schema cho form tạo nhân viên
export const createStaffSchema = z.object({
  firstName: z.string().trim().min(1, 'Họ là bắt buộc'),
  lastName: z.string().trim().min(1, 'Tên là bắt buộc'),
  email: z.string().trim().email('Email không hợp lệ').optional(),
  phone: z.string()
    .trim()
    .min(1, 'Số điện thoại là bắt buộc')
    .regex(/^(0[1-9][0-9]{8})$/, 'Số điện thoại phải có 10 số và bắt đầu bằng 0'),
  identityId: z.string().trim().min(1, 'CMND/CCCD là bắt buộc'),
  dateOfBirth: z.string().trim().min(1, 'Ngày sinh là bắt buộc'),
  address: z.string().trim().min(1, 'Địa chỉ là bắt buộc'),
  city: z.string().trim().min(1, 'Thành phố là bắt buộc'),
  branchId: z.string().trim().min(1, 'Chi nhánh là bắt buộc'),
  role: z.enum(STAFF_ROLES, { message: 'Vai trò không hợp lệ' }),
  shiftType: z.enum(SHIFT_TYPES),
  salary: z.number().min(0, 'Lương phải lớn hơn hoặc bằng 0'),
  hireDate: z.string().trim().min(1, 'Ngày vào làm là bắt buộc'),
  pinPos: z.string().trim().min(1, 'PIN POS là bắt buộc'),
  status: z.enum(STATUSES),
});

// Schema cho form chỉnh sửa nhân viên
export const editStaffSchema = z.object({
  firstName: z.string().trim().min(1, 'Họ là bắt buộc'),
  lastName: z.string().trim().min(1, 'Tên là bắt buộc'),
  email: z.string().trim().email('Email không hợp lệ').optional(),
  phone: z.string()
    .trim()
    .min(1, 'Số điện thoại là bắt buộc')
    .regex(/^(0[1-9][0-9]{8})$/, 'Số điện thoại phải có 10 số và bắt đầu bằng 0'),
  identityId: z.string().trim().min(1, 'CMND/CCCD là bắt buộc'),
  dateOfBirth: z.string().trim().min(1, 'Ngày sinh là bắt buộc'),
  address: z.string().trim().min(1, 'Địa chỉ là bắt buộc'),
  city: z.string().trim().min(1, 'Thành phố là bắt buộc'),
  role: z.enum(STAFF_ROLES, { message: 'Vai trò không hợp lệ' }),
  department: z.enum(DEPARTMENTS, { message: 'Phòng ban không hợp lệ' }),
  shiftType: z.enum(SHIFT_TYPES),
  salary: z.number().min(0, 'Lương phải lớn hơn hoặc bằng 0'),
});

// Helper: Map role → department
export const getDepartmentFromRole = (role: string): string => {
  const departmentMap: Record<string, string> = {
    manager: 'Quản lý',
    chef: 'Bếp',
    waiter: 'Phục vụ',
    cashier: 'Tính tiền',
    staff: 'Khác',
  };
  return departmentMap[role] || 'Khác';
};

// Helper: Map role → display name
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    manager: 'Quản lý',
    chef: 'Đầu bếp',
    waiter: 'Phục vụ',
    cashier: 'Thu ngân',
    staff: 'Nhân viên',
  };
  return roleMap[role] || role;
};