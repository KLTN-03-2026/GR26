# 📁 Source Code Structure

## ✅ Đã được setup

### 📦 Dependencies
- **zustand** v5.0.12 - Global state management
- **zod** v4.3.6 - Schema validation
- **react-router-dom** v7.13.2 - Routing
- **lucide-react** v1.7.0 - Icons
- **tailwindcss** v4.2.2 - CSS framework
- **@tanstack/react-query** - Server state management
- **axios** - HTTP client
- **date-fns** - Date utilities
- **clsx** + **tailwind-merge** - Class name utilities

### 📂 Directory Structure Created

```
src/
├── routes/              # Routing configuration
├── layouts/             # Layout components (Auth, Admin, App, POS)
├── pages/               # Page components by role
│   ├── auth/           # Login, Register, Forgot Password
│   ├── admin/          # Admin-only pages
│   ├── owner/          # Owner-only pages  
│   ├── shared/         # Owner + Staff pages
│   └── pos/            # POS interface pages
├── modules/            # Business logic modules
│   ├── auth/          # ✅ Auth store & types created
│   ├── branch/
│   ├── staff/
│   ├── menu/
│   ├── order/
│   ├── inventory/
│   ├── payment/
│   ├── voucher/
│   ├── supplier/
│   └── report/
├── shared/             # Shared utilities and components
│   ├── components/
│   │   ├── ui/        # shadcn/ui components (install as needed)
│   │   ├── layout/    # Sidebar, Header, Breadcrumb
│   │   └── common/    # DataTable, SearchBar, etc.
│   ├── hooks/         # ✅ useDebounce, usePagination, usePermission
│   ├── utils/         # ✅ cn, formatCurrency, formatDate, getRoleHomePage
│   ├── constants/     # ✅ roles, routes, queryKeys
│   └── types/         # ✅ api.types, common.types
├── lib/               # ✅ axios, queryClient setup
└── providers/         # Context providers (to be created)
```

### ✅ Files Created

**Constants:**
- `shared/constants/roles.ts` - Role definitions (ADMIN, OWNER, STAFF)
- `shared/constants/routes.ts` - All route paths
- `shared/constants/queryKeys.ts` - TanStack Query keys factory

**Types:**
- `shared/types/api.types.ts` - API response types
- `shared/types/common.types.ts` - Common enums and types
- `modules/auth/types/auth.types.ts` - Auth-specific types

**Utils:**
- `shared/utils/cn.ts` - Tailwind class merge utility
- `shared/utils/formatCurrency.ts` - Vietnamese currency formatting
- `shared/utils/formatDate.ts` - Date/time formatting with date-fns
- `shared/utils/getRoleHomePage.ts` - Get homepage by role

**Hooks:**
- `shared/hooks/useDebounce.ts` - Debounce hook
- `shared/hooks/usePagination.ts` - Pagination state management
- `shared/hooks/usePermission.ts` - Permission checking (placeholder)

**Lib:**
- `lib/axios.ts` - Axios instance with interceptors (token, tenant_id, refresh)
- `lib/queryClient.ts` - TanStack Query client configuration

**Stores:**
- `modules/auth/stores/authStore.ts` - Zustand auth store with persistence

**Config:**
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/index.css` - Updated with Tailwind directives

## 🚀 Next Steps

1. **Setup TypeScript paths** - Configure `@/` alias in tsconfig.json
2. **Install shadcn/ui** - Add UI components as needed
3. **Create Layouts** - AuthLayout, AdminLayout, AppLayout, PosLayout
4. **Setup Routing** - Create route configuration files
5. **Create Auth Pages** - Login, Register pages
6. **Create Providers** - AuthProvider, TenantProvider, BranchProvider
7. **Implement Auth Service** - API calls for login/register

## 💡 Usage Examples

### Zustand Store
```typescript
import { useAuthStore } from '@/modules/auth/stores/authStore';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore();
  // ...
}
```

### TanStack Query
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/queryKeys';

function BranchList() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: () => branchService.getAll(),
  });
}
```

### Axios
```typescript
import axiosInstance from '@/lib/axios';

export const branchService = {
  async getAll() {
    const response = await axiosInstance.get('/branches');
    return response.data;
  },
};
```

### Utils
```typescript
import { formatVND } from '@/shared/utils/formatCurrency';
import { formatDateTime } from '@/shared/utils/formatDate';
import { cn } from '@/shared/utils/cn';

// Currency: formatVND(150000) → "150.000 ₫"
// Date: formatDateTime(new Date()) → "26/03/2024 14:30"
// Classes: cn('btn', isActive && 'btn-active')
```

## 📝 Notes

- All module folders follow the same structure: components, hooks, services, stores, types
- Use `@/` path alias (needs tsconfig setup)
- Follow naming conventions from project-structure.md
- Use TanStack Query for server state, Zustand for client state
