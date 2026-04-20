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

  // Branches
  branches: {
    all: ['branches'] as const,
    list: (filters?: Record<string, unknown>) => ['branches', 'list', filters] as const,
    detail: (id: string) => ['branches', 'detail', id] as const,
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

  // Payments & invoices
  payments: {
    all: ['payments'] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    invoiceDetail: (id: string) => ['payments', 'invoice-detail', id] as const,
    invoiceSearch: (filters?: Record<string, unknown>) => ['payments', 'invoice-search', filters] as const,
    orderInvoice: (orderId: string) => ['payments', 'order-invoice', orderId] as const,
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
    hr: (filters?: Record<string, unknown>) => ['reports', 'hr', filters] as const,
  },
} as const;
