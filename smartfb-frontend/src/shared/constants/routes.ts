export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PLANS: '/admin/plans',
  ADMIN_TENANTS: '/admin/tenants',

  // Owner routes - grouped by category
  OWNER: {
    DASHBOARD: '/owner/dashboard',
    TABLES: '/owner/tables',
    TABLES_NEW: '/owner/tables/new',
    TABLES_DETAIL: '/owner/tables/:id',
    ORDERS: '/owner/orders',
    REVENUE: '/owner/revenue',
    MENU: '/owner/menu',
    INVENTORY: '/owner/inventory',
    RECIPES: '/owner/recipes',
    STAFF: '/owner/staff',
    STAFF_NEW: '/owner/staff/new',
    STAFF_DETAIL: '/owner/staff/:id',
    STAFF_POSITIONS: '/owner/staff/positions',
    SCHEDULES: '/owner/schedules',
    BRANCHES: '/owner/branches',
    BRANCHES_NEW: '/owner/branches/new',
    BRANCHES_DETAIL: '/owner/branches/:id',
    PROMOTIONS: '/owner/promotions',
    SUPPLIERS: '/owner/suppliers',
    REPORTS: '/owner/reports',
    SETTINGS: '/owner/settings',
    PACKAGES: '/owner/packages',
  },

  // Staff routes - POS namespace cho nhân viên
  STAFF: {
    DASHBOARD: '/pos/dashboard',
    TABLES: '/pos/tables',
    ORDERS: '/pos/orders',
    MENU: '/pos/menu',
    RECIPES: '/pos/recipes',
    INVENTORY: '/pos/inventory',
    MY_SHIFTS: '/pos/my-shifts',
  },

  // Shared routes (Owner + Staff)
  INGREDIENTS: '/inventory/ingredients',
  SEMI_PRODUCTS: '/inventory/semi-products',
  STOCK_ENTRY: '/inventory/stock-entry',
  STOCK_EXIT: '/inventory/stock-exit',
  STOCK_TAKING: '/inventory/stock-taking',
  SHIFT_SCHEDULE: '/shifts/schedule',
  MY_SHIFT: '/shifts/my-shift',

  // POS routes
  POS_SELECT_BRANCH: '/pos/select-branch',
  POS_ORDER: '/pos/order',
  POS_ORDER_DETAIL: '/pos/orders/:orderId',
  POS_TABLE_MAP: '/pos/table-map',
  POS_PAYMENT: '/pos/payment',
  POS_MANAGEMENT: '/pos/management',
} as const;
