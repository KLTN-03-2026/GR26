/**
 * Trạng thái chi nhánh theo backend
 * ACTIVE: Đang hoạt động
 * INACTIVE: Ngừng hoạt động
 */
export type BranchStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Branch entity theo backend response
 */
export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  status: BranchStatus;
  createdAt: string;
}

/**
 * Trạng thái dùng cho filter của màn hình danh sách chi nhánh.
 * Bám sát enum backend để tránh map sai trạng thái.
 */
export type BranchFilterStatus = BranchStatus;

export type BranchFilters = {
  search: string;
  status: BranchFilterStatus | 'all';
  location: string | 'all';
};

/**
 * Item hiển thị trên bảng branch.
 * `location` được suy ra từ địa chỉ để phục vụ filter ở UI.
 */
export type BranchListItem = Branch & {
  location: string;
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
  address: string;
  phone: string;
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
 * Payload gửi lên khi cập nhật chi nhánh.
 * Backend dùng chung `BranchRequest` cho create và update nên FE phải gửi đủ field.
 */
export type UpdateBranchPayload = CreateBranchPayload;

/**
 * Payload gán user vào chi nhánh
 */
export type AssignUserToBranchPayload = {
  userId: string;
};

/**
 * Cấu hình cổng thanh toán PayOS của một chi nhánh.
 * BE chỉ trả về masked key — không bao giờ trả raw key.
 */
export interface PaymentGatewayConfig {
  isConfigured: boolean;
  clientId: string | null;
  apiKeyMasked: string | null;
  checksumKeyMasked: string | null;
}

/**
 * Payload Owner gửi lên để lưu cấu hình PayOS cho chi nhánh.
 * Chứa raw key — chỉ dùng khi gửi lên BE, không lưu ở FE.
 */
export interface PaymentGatewayConfigPayload {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}
