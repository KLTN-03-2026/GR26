/**
 * Các mã quyền thao tác dùng để điều khiển UI theo capability.
 * Owner/Admin có thể bypass lớp permission chi tiết ở FE,
 * còn staff sẽ dựa vào các mã này để mở route và thao tác tương ứng.
 */
export const PERMISSIONS = {
  STAFF_DASHBOARD_VIEW: 'STAFF_DASHBOARD_VIEW',
  // Xem danh sách và chi tiết nhân viên trong tenant hoặc chi nhánh được phân quyền.
  STAFF_VIEW: 'STAFF_VIEW',
  // Tạo, cập nhật, vô hiệu hóa hoặc gán thông tin nhân viên.
  STAFF_EDIT: 'STAFF_EDIT',
  TABLE_VIEW: 'TABLE_VIEW',
  TABLE_ASSIGN: 'TABLE_ASSIGN',
  ORDER_VIEW: 'ORDER_VIEW',
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_UPDATE: 'ORDER_UPDATE',
  ORDER_CANCEL: 'ORDER_CANCEL',
  MENU_VIEW: 'MENU_VIEW',
  MENU_EDIT: 'MENU_EDIT',
  // Xem và chỉnh sửa cấu hình chi nhánh, gồm cấu hình cổng thanh toán PayOS.
  BRANCH_EDIT: 'BRANCH_EDIT',
  // Backend hiện đang phát PAYMENT_CREATE trong JWT; giữ thêm PAYMENT_PROCESS để tương thích token cũ.
  PAYMENT_VIEW: 'PAYMENT_VIEW',
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  PAYMENT_PROCESS: 'PAYMENT_PROCESS',
  // Xem danh sách và chi tiết phiếu chi theo chi nhánh đang làm việc.
  EXPENSE_VIEW: 'EXPENSE_VIEW',
  // Tạo, sửa, xóa phiếu chi vận hành.
  EXPENSE_MANAGE: 'EXPENSE_MANAGE',
  KDS_VIEW: 'KDS_VIEW',
  KDS_UPDATE: 'KDS_UPDATE',
  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_IMPORT: 'INVENTORY_IMPORT',
  INVENTORY_ADJUST: 'INVENTORY_ADJUST',
  INVENTORY_WASTE: 'INVENTORY_WASTE',
  // Xem danh sách role tenant để quản lý quyền theo vai trò.
  ROLE_VIEW: 'ROLE_VIEW',
  // Tạo hoặc chỉnh sửa role của tenant.
  ROLE_EDIT: 'ROLE_EDIT',
  // Bật hoặc tắt permission bên trong một role.
  PERMISSION_EDIT: 'PERMISSION_EDIT',
  SCHEDULE_VIEW: 'SCHEDULE_VIEW',
  SHIFT_VIEW: 'SHIFT_VIEW',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Quyền mở luồng thanh toán cần hỗ trợ cả mã mới từ backend và mã FE cũ để tránh redirect sai route.
const PAYMENT_ROUTE_PERMISSIONS = [
  PERMISSIONS.PAYMENT_VIEW,
  PERMISSIONS.PAYMENT_CREATE,
  PERMISSIONS.PAYMENT_PROCESS,
] as const;

/**
 * Gom nhóm quyền tối thiểu để mở từng route staff.
 * Dùng `some()` thay vì `every()` để hỗ trợ các token cũ
 * chưa phát đầy đủ mã quyền tổng quát như `INVENTORY_VIEW`.
 */
export const STAFF_ROUTE_PERMISSIONS = {
  DASHBOARD: [PERMISSIONS.STAFF_DASHBOARD_VIEW],
  // Cho phép branch manager hoặc staff được phân quyền mở màn quản lý nhân viên.
  STAFF: [PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_EDIT],
  // Cho phép mở màn chức vụ và ma trận phân quyền.
  STAFF_POSITIONS: [PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_EDIT, PERMISSIONS.PERMISSION_EDIT],
  TABLES: [PERMISSIONS.TABLE_VIEW, PERMISSIONS.TABLE_ASSIGN, PERMISSIONS.ORDER_CREATE],
  ORDERS: [
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    ...PAYMENT_ROUTE_PERMISSIONS,
  ],
  PAYMENT: [...PAYMENT_ROUTE_PERMISSIONS],
  EXPENSES: [PERMISSIONS.EXPENSE_VIEW, PERMISSIONS.EXPENSE_MANAGE, ...PAYMENT_ROUTE_PERMISSIONS],
  KDS: [PERMISSIONS.KDS_VIEW, PERMISSIONS.KDS_UPDATE],
  MENU: [PERMISSIONS.MENU_VIEW],
  RECIPES: [PERMISSIONS.MENU_VIEW],
  INVENTORY: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_IMPORT,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_WASTE,
  ],
  MY_SHIFTS: [PERMISSIONS.SCHEDULE_VIEW, PERMISSIONS.SHIFT_VIEW],
  // Dùng lại quyền kho — xem dự báo AI là một dạng xem tồn kho nâng cao.
  AI_FORECAST: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_IMPORT,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_WASTE,
  ],
  // Route tạo/chỉnh đơn chỉ dành cho user có quyền tạo đơn.
  POS_ORDER: [PERMISSIONS.ORDER_CREATE],
  POS_PAYMENT: [...PAYMENT_ROUTE_PERMISSIONS],
  POS_MANAGEMENT: [PERMISSIONS.ORDER_VIEW],
} as const;
