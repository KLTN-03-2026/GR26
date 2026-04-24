import type { BranchDetail } from '../data/branchDetails';

/**
 * Trạng thái chi nhánh theo backend
 * ACTIVE: Đang hoạt động
 * INACTIVE: Ngừng hoạt động
 * TEMPORARILY_CLOSED: Tạm đóng chi nhánh
 */
export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED';

/**
 * Branch entity theo backend response
 */
export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: BranchStatus;
  createdAt: string;
}

/**
 * Trạng thái hiển thị ở UI danh sách chi nhánh.
 * Khác với `BranchStatus` vì màn hình quản trị đang dùng nhãn rút gọn `active/inactive`.
 */
export type BranchFilterStatus = BranchDetail['status'];

export type BranchFilters = {
  search: string;
  status: BranchFilterStatus | 'all';
  location: string | 'all';
};

export type BranchListItem = BranchDetail & {
  revenueDisplay: string;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

// Activity log types
export type ActivityActionType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'activate' 
  | 'deactivate';

export type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  action: ActivityActionType;
  branchId?: string;
  branchName?: string;
  timestamp: string;
  description: string;
};

/**
 * Dữ liệu form tạo chi nhánh mà backend hiện hỗ trợ.
 * Giữ riêng type này để page và component form dùng chung một contract.
 */
export type Step1BasicInfoData = {
  name: string;
  code: string;
  address: string;
  phone: string;
};

/**
 * Alias dữ liệu form cho luồng tạo chi nhánh hiện tại.
 * Tách alias để sau này có thể mở rộng lại flow mà không đổi contract ở page.
 */
export type CreateBranchFormData = Step1BasicInfoData;

// Edit branch types - chỉ edit được những fields cơ bản
export type EditBranchFormData = {
  name: string;
  code: string;
  taxCode: string;
  address: string;
  city: string;
  phone: string;
  openTime: string;
  closeTime: string;
  managerId?: string;
  isOpened?: boolean;
};

/**
 * Payload gửi lên khi tạo chi nhánh
 * Khớp với BranchRequest từ backend
 */
export type CreateBranchPayload = {
  name: string;
  code: string;
  address: string;
  phone: string;
};

/**
 * Payload gửi lên khi cập nhật chi nhánh
 */
export type UpdateBranchPayload = Partial<CreateBranchPayload>;

/**
 * Payload gán user vào chi nhánh
 */
export type AssignUserToBranchPayload = {
  userId: string;
};
