/**
 * Role tenant dùng để gán permission và sau đó gán cho nhân viên.
 */
export interface StaffRole {
  id: string;
  name: string;
  description: string | null;
  permissionIds: string[];
}

/**
 * Permission seed hệ thống mà backend trả về trong role matrix.
 */
export interface StaffPermissionDefinition {
  id: string;
  module: string;
  description: string;
}

/**
 * Response `GET /roles`.
 */
export interface StaffRoleMatrixResponse {
  roles: StaffRole[];
  allPermissions: StaffPermissionDefinition[];
}

/**
 * Payload tạo role mới.
 */
export interface CreateRoleRequest {
  name: string;
  description?: string;
}

/**
 * Payload cập nhật full permission set cho role.
 */
export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}
