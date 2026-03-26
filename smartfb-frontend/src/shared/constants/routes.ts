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
    ORDERS: '/owner/orders',
    REVENUE: '/owner/revenue',
    MENU: '/owner/menu',
    INVENTORY: '/owner/inventory',
    RECIPES: '/owner/recipes',
    STAFF: '/owner/staff',
    SCHEDULES: '/owner/schedules',
    BRANCHES: '/owner/branches',
    PROMOTIONS: '/owner/promotions',
    SUPPLIERS: '/owner/suppliers',
    REPORTS: '/owner/reports',
    SETTINGS: '/owner/settings',
    PACKAGES: '/owner/packages',
  },

  // Staff routes - limited access
  STAFF: {
    DASHBOARD: '/staff/dashboard',
    TABLES: '/staff/tables',
    ORDERS: '/staff/orders',
    MY_SHIFTS: '/staff/my-shifts',
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
  POS_TABLE_MAP: '/pos/table-map',
  POS_PAYMENT: '/pos/payment',
} as const;
