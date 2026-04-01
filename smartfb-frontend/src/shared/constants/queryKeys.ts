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
  
  // Staff
  staff: {
    all: ['staff'] as const,
    list: (filters?: Record<string, unknown>) => ['staff', 'list', filters] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
  },
  
  // Menu
  menu: {
    all: ['menu'] as const,
    list: (filters?: Record<string, unknown>) => ['menu', 'list', filters] as const,
    detail: (id: string) => ['menu', 'detail', id] as const,
    categories: ['menu', 'categories'] as const,
    toppings: ['menu', 'toppings'] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    active: ['orders', 'active'] as const,
  },
  
  // Inventory
  inventory: {
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
  
  // Reports
  reports: {
    revenue: (filters?: Record<string, unknown>) => ['reports', 'revenue', filters] as const,
    inventory: (filters?: Record<string, unknown>) => ['reports', 'inventory', filters] as const,
    hr: (filters?: Record<string, unknown>) => ['reports', 'hr', filters] as const,
  },
} as const;
