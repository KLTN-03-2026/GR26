/**
 * TanStack Query keys tập trung
 * Sử dụng factory pattern để tạo query keys có cấu trúc
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
    permissions: ['auth', 'permissions'] as const,
  },

  // Admin SaaS
  admin: {
    all: ['admin'] as const,
    dashboard: () => ['admin', 'dashboard'] as const,
    tenants: (filters?: Record<string, unknown>) => ['admin', 'tenants', filters] as const,
    tenantDetail: (id: string) => ['admin', 'tenants', 'detail', id] as const,
    plans: (filters?: Record<string, unknown>) => ['admin', 'plans', filters] as const,
    planDetail: (id: string) => ['admin', 'plans', 'detail', id] as const,
    activePlans: () => ['admin', 'plans', 'active'] as const,
    invoices: (filters?: Record<string, unknown>) => ['admin', 'invoices', filters] as const,
    invoiceDetail: (id: string) => ['admin', 'invoices', 'detail', id] as const,
  },

  // Branches
  branches: {
    all: ['branches'] as const,
    list: (filters?: Record<string, unknown>) => ['branches', 'list', filters] as const,
    detail: (id: string) => ['branches', 'detail', id] as const,
    paymentConfig: (id: string) => ['branches', 'payment-config', id] as const,
  },

  // Tables
  tables: {
    all: ['tables'] as const,
    // Prefix danh sách bàn, dùng khi chỉ cần refresh trạng thái bàn mà không đụng khu vực.
    lists: ['tables', 'list'] as const,
    list: (filters?: Record<string, unknown>) => ['tables', 'list', filters] as const,
    detail: (id: string) => ['tables', 'detail', id] as const,
    zones: ['tables', 'zones'] as const,
  },

  // Staff
  staff: {
    all: ['staff'] as const,
    list: (filters?: Record<string, unknown>) => ['staff', 'list', filters] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
  },

  // Positions
  positions: {
    all: ['positions'] as const,
    list: () => ['positions', 'list'] as const,
  },

  // Roles & permissions
  roles: {
    all: ['roles'] as const,
    matrix: () => ['roles', 'matrix'] as const,
  },

  // Menu
  menu: {
    all: ['menu'] as const,
    list: (filters?: Record<string, unknown>) => ['menu', 'list', filters] as const,
    activeList: (branchId?: string | null) => ['menu', 'active-list', branchId ?? 'global'] as const,
    detail: (id: string) => ['menu', 'detail', id] as const,
    branchItems: (branchId: string, itemIds: string[]) => ['menu', 'branch-items', branchId, itemIds] as const,
    branchItemDetail: (branchId: string, itemId: string) => ['menu', 'branch-item', branchId, itemId] as const,
    categories: ['menu', 'categories'] as const,
    addons: ['menu', 'addons'] as const,
    toppings: ['menu', 'toppings'] as const,
  },

  // Recipes
  recipes: {
    all: ['recipes'] as const,
    menuItems: (filters?: Record<string, unknown>) => ['recipes', 'menu-items', filters] as const,
    categories: ['recipes', 'categories'] as const,
    ingredients: ['recipes', 'ingredients'] as const,
    detail: (itemId: string) => ['recipes', 'detail', itemId] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    // Prefix danh sách order, dùng để tránh kéo theo detail và active order của bàn.
    lists: ['orders', 'list'] as const,
    list: (filters?: Record<string, unknown>) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    active: ['orders', 'active'] as const,
    activeByTable: (tableId: string) => ['orders', 'active', 'table', tableId] as const,
  },

  // POS Sessions
  posSessions: {
    all: ['pos-sessions'] as const,
    active: (branchId?: string | null) => ['pos-sessions', 'active', branchId ?? 'no-branch'] as const,
    history: (branchId?: string | null) => ['pos-sessions', 'history', branchId ?? 'no-branch'] as const,
    // author: Hoàng | date: 2026-04-30 | note: Breakdown doanh thu theo phương thức — live-query, stale sau 30s.
    revenueBreakdown: (sessionId: string) => ['pos-sessions', 'revenue-breakdown', sessionId] as const,
    // author: Hoàng | date: 2026-05-01 | note: Breakdown chi phí theo phương thức — tổng hợp từ financial invoices API filter theo ngày ca.
    expenseBreakdown: (sessionId: string) => ['pos-sessions', 'expense-breakdown', sessionId] as const,
  },

  // Payments & invoices
  payments: {
    all: ['payments'] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    invoiceDetail: (id: string) => ['payments', 'invoice-detail', id] as const,
    invoiceSearch: (filters?: Record<string, unknown>) => ['payments', 'invoice-search', filters] as const,
    orderInvoice: (orderId: string) => ['payments', 'order-invoice', orderId] as const,
  },

  // Subscription gói dịch vụ của tenant hiện tại
  subscriptions: {
    all: ['subscriptions'] as const,
    current: ['subscriptions', 'current'] as const,
  },

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    list: (filters?: Record<string, unknown>) => ['expenses', 'list', filters] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
  },

  // Inventory
  inventory: {
    balances: {
      all: ['inventory', 'balances'] as const,
      list: (filters?: Record<string, unknown>) => ['inventory', 'balances', 'list', filters] as const,
    },
    // Lịch sử giao dịch kho (nhập, xuất, điều chỉnh, hao hụt)
    transactions: {
      all: ['inventory', 'transactions'] as const,
      list: (filters?: Record<string, unknown>) => ['inventory', 'transactions', 'list', filters] as const,
    },
    ingredients: {
      all: ['inventory', 'ingredients'] as const,
      list: (filters?: Record<string, unknown>) => ['inventory', 'ingredients', 'list', filters] as const,
      detail: (id: string) => ['inventory', 'ingredients', 'detail', id] as const,
    },
    semiProducts: {
      all: ['inventory', 'semi-products'] as const,
      list: (filters?: Record<string, unknown>) => ['inventory', 'semi-products', 'list', filters] as const,
      detail: (id: string) => ['inventory', 'semi-products', 'detail', id] as const,
    },
    stockEntries: {
      all: ['inventory', 'stock-entries'] as const,
      list: (filters?: Record<string, unknown>) => ['inventory', 'stock-entries', 'list', filters] as const,
    },
  },

  // Vouchers
  vouchers: {
    all: ['vouchers'] as const,
    list: (filters?: Record<string, unknown>) => ['vouchers', 'list', filters] as const,
    detail: (id: string) => ['vouchers', 'detail', id] as const,
  },

  // Suppliers
  suppliers: {
    all: ['suppliers'] as const,
    list: (filters?: Record<string, unknown>) => ['suppliers', 'list', filters] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },

  // Shifts
  shifts: {
    templates: {
      all: ['shifts', 'templates'] as const,
      list: (filters?: Record<string, unknown>) => ['shifts', 'templates', 'list', filters] as const,
      detail: (id: string) => ['shifts', 'templates', id] as const,
    },
    schedules: {
      all: ['shifts', 'schedules'] as const,
      list: (filters?: Record<string, unknown>) => ['shifts', 'schedules', 'list', filters] as const,
      detail: (id: string) => ['shifts', 'schedules', 'detail', id] as const,
      my: (startDate: string, endDate: string) => ['shifts', 'schedules', 'my', { startDate, endDate }] as const,
    },
    register: ['shifts', 'register'] as const,
  },

  // Reports
  reports: {
    // Báo cáo doanh thu tổng quan theo khoảng ngày của một chi nhánh.
    revenue: (filters?: Record<string, unknown>) => ['reports', 'revenue', filters] as const,
    // Heatmap doanh thu theo từng giờ trong một ngày để dựng chart cột.
    hourlyHeatmap: (filters?: Record<string, unknown>) => ['reports', 'hourly-heatmap', filters] as const,
    // Top sản phẩm bán chạy trong ngày của chi nhánh đang chọn.
    topItems: (filters?: Record<string, unknown>) => ['reports', 'top-items', filters] as const,
    // Tỷ trọng thanh toán theo phương thức để hiển thị breakdown.
    paymentBreakdown: (filters?: Record<string, unknown>) => ['reports', 'payment-breakdown', filters] as const,
    inventory: (filters?: Record<string, unknown>) => ['reports', 'inventory', filters] as const,
    // Tồn kho hiện tại theo chi nhánh.
    inventoryStock: (filters?: Record<string, unknown>) => ['reports', 'inventory', 'stock', filters] as const,
    // Lô hàng sắp hết hạn theo ngưỡng ngày.
    inventoryExpiring: (filters?: Record<string, unknown>) => ['reports', 'inventory', 'expiring', filters] as const,
    // Hao hụt nguyên liệu trong khoảng ngày.
    inventoryWaste: (filters?: Record<string, unknown>) => ['reports', 'inventory', 'waste', filters] as const,
    // Biến động kho Nhập/Xuất/Tồn theo kỳ.
    inventoryMovement: (filters?: Record<string, unknown>) => ['reports', 'inventory', 'movement', filters] as const,
    // Giá vốn hàng bán FIFO.
    inventoryCogs: (filters?: Record<string, unknown>) => ['reports', 'inventory', 'cogs', filters] as const,
    hr: (filters?: Record<string, unknown>) => ['reports', 'hr', filters] as const,
    // Chấm công tháng theo chi nhánh.
    hrAttendance: (filters?: Record<string, unknown>) => ['reports', 'hr', 'attendance', filters] as const,
    // Tổng chi phí nhân sự tháng.
    hrCost: (filters?: Record<string, unknown>) => ['reports', 'hr', 'cost', filters] as const,
    // Vi phạm chấm công trong khoảng ngày.
    hrViolations: (filters?: Record<string, unknown>) => ['reports', 'hr', 'violations', filters] as const,
    // Bảng lương tháng.
    hrPayroll: (filters?: Record<string, unknown>) => ['reports', 'hr', 'payroll', filters] as const,
    // Lịch sử check-in chi tiết.
    hrCheckinHistory: (filters?: Record<string, unknown>) => ['reports', 'hr', 'checkin-history', filters] as const,
    // Prefix cache sổ thu chi để refresh mọi filter sau khi tạo/sửa/xóa phiếu chi.
    financialInvoicesAll: ['reports', 'financial', 'invoices'] as const,
    // Lịch sử hóa đơn Thu/Chi.
    financialInvoices: (filters?: Record<string, unknown>) => ['reports', 'financial', 'invoices', filters] as const,
  },

  // Account (cá nhân)
  account: {
    all: ['account'] as const,
    // Profile cá nhân — GET /api/v1/account/me
    me: ['account', 'me'] as const,
  },

  // AI Forecast
  forecast: {
    // Dự báo tồn kho toàn chi nhánh (7 ngày tới)
    detail: (branchId: string) => ['ai-forecast', 'detail', branchId] as const,
    // Tóm tắt số lượng theo mức độ khẩn cấp
    summary: (branchId: string) => ['ai-forecast', 'summary', branchId] as const,
    // Dự báo một nguyên liệu cụ thể
    ingredient: (branchId: string, ingredientId: string) =>
      ['ai-forecast', 'ingredient', branchId, ingredientId] as const,
    // Trạng thái train model
    trainStatus: (branchId: string) => ['ai-forecast', 'train-status', branchId] as const,
    // Config train (n_forecasts, epochs, weekly_seasonality, active_days...)
    config: (branchId: string) => ['ai-forecast', 'config', branchId] as const,
    // Lịch sử nhiều lần train gần nhất
    trainLogs: (branchId: string, limit?: number) => ['ai-forecast', 'train-logs', branchId, limit] as const,
  },
} as const;
