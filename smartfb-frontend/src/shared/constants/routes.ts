export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PLANS: '/admin/plans',
  ADMIN_TENANTS: '/admin/tenants',
  
  // Owner routes
  DASHBOARD: '/dashboard',
  BRANCHES: '/branches',
  STAFF: '/staff',
  PERMISSIONS: '/permissions',
  MENU: '/menu',
  CATEGORY: '/category',
  TOPPING: '/topping',
  RECIPE: '/recipe',
  VOUCHERS: '/vouchers',
  SUPPLIERS: '/suppliers',
  
  // Reports
  REVENUE_REPORT: '/reports/revenue',
  INVENTORY_REPORT: '/reports/inventory',
  HR_REPORT: '/reports/hr',
  
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
