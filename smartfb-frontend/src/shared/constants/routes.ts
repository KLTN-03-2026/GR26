export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PLANS: '/admin/plans',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_BILLING: '/admin/billing',
  ADMIN_SETTINGS: '/admin/settings',

  // Owner routes - grouped by category
  OWNER: {
    DASHBOARD: '/owner/dashboard',
    TABLES: '/owner/tables',
    TABLES_NEW: '/owner/tables/new',
    TABLES_DETAIL: '/owner/tables/:id',
    ORDERS: '/owner/orders',
    REVENUE: '/owner/revenue',
    EXPENSES: '/owner/expenses',
    MENU: '/owner/menu',
    INVENTORY: '/owner/inventory',
    RECIPES: '/owner/recipes',
    STAFF: '/owner/staff',
    STAFF_NEW: '/owner/staff/new',
    STAFF_DETAIL: '/owner/staff/:id',
    STAFF_POSITIONS: '/owner/staff/positions',
    SCHEDULES: '/owner/schedules',
    SHIFT_TEMPLATE_DETAIL: '/owner/schedules/:id',
    SHIFT_TEMPLATE_NEW: '/owner/schedules/new',
    BRANCHES: '/owner/branches',
    BRANCHES_NEW: '/owner/branches/new',
    BRANCHES_DETAIL: '/owner/branches/:id',
    PROMOTIONS: '/owner/promotions',
    PROMOTIONS_NEW: '/owner/promotions/new',      // Thêm mới
    PROMOTIONS_DETAIL: '/owner/promotions/:id',
    POS_SESSIONS: '/owner/pos-sessions',
    SUPPLIERS: '/owner/suppliers',
    SUPPLIERS_DETAIL: '/owner/suppliers/:id',
    REPORTS: '/owner/reports',
    REPORT_REVENUE: '/owner/reports/revenue',
    REPORT_INVENTORY: '/owner/reports/inventory',
    REPORT_HR: '/owner/reports/hr',
    SETTINGS: '/owner/settings',
    PACKAGES: '/owner/packages',
    AI_FORECAST: '/owner/inventory/ai-forecast',
  },

  // Staff routes - POS namespace cho nhân viên
  STAFF: {
    DASHBOARD: '/pos/dashboard',
    STAFF: '/pos/staff',
    STAFF_POSITIONS: '/pos/staff/positions',
    TABLES: '/pos/tables',
    ORDERS: '/pos/orders',
    EXPENSES: '/pos/expenses',
    MENU: '/pos/menu',
    RECIPES: '/pos/recipes',
    INVENTORY: '/pos/inventory',
    AI_FORECAST: '/pos/inventory/ai-forecast',
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
