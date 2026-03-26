# 📁 SmartF&B Frontend — Project Structure & Architecture Guide

> **Dành cho AI Assistant:** Đây là tài liệu mô tả toàn bộ kiến trúc frontend của dự án SmartF&B.
> Đọc kỹ file này trước khi thực hiện bất kỳ task nào. Mọi quyết định về cấu trúc file,
> đặt tên, và tổ chức code đều phải tuân theo tài liệu này.

---

## 🧭 Tổng quan dự án

**SmartF&B** là nền tảng SaaS quản lý chuỗi F&B đa chi nhánh.

| Hạng mục | Chi tiết |
|----------|----------|
| **Framework** | React 18 + TypeScript (Vite) |
| **Routing** | React Router DOM v6 (`createBrowserRouter`) |
| **UI Library** | shadcn/ui (Radix UI + Tailwind CSS) |
| **State Management** | Zustand (global), TanStack Query (server state) |
| **HTTP Client** | Axios (instance tập trung tại `src/lib/axios.ts`) |
| **Form** | React Hook Form + Zod |
| **Realtime** | Socket.io client |
| **Icons** | Lucide React |

---

## 👥 Các Role trong hệ thống

```
ADMIN   → Super Admin của nền tảng SaaS (quản lý gói, tenant)
OWNER   → Chủ quán (quản lý toàn bộ chuỗi của mình)
STAFF   → Nhân viên (cashier, barista, waiter, branch_manager)
```

- **ADMIN** vs **OWNER/STAFF**: Khác biệt **hoàn toàn** về layout, routes, và tính năng.
- **OWNER** vs **STAFF**: Dùng chung layout, khác nhau ở sidebar menu và quyền truy cập một số trang.

---

## 🗂️ Cấu trúc thư mục đầy đủ

```
src/
├── routes/                         # ← ROUTING tập trung tại đây
│   ├── index.tsx                   # Root router (createBrowserRouter)
│   ├── ProtectedRoute.tsx          # Guard: kiểm tra auth + role
│   ├── RoleGuard.tsx               # Guard inline dùng trong từng route
│   ├── publicRoutes.tsx            # Routes không cần auth
│   ├── adminRoutes.tsx             # Routes chỉ dành cho ADMIN
│   ├── ownerRoutes.tsx             # Routes cho OWNER (full access)
│   ├── staffRoutes.tsx             # Routes cho STAFF (giới hạn)
│   └── posRoutes.tsx               # Routes giao diện POS bán hàng
│
├── layouts/                        # Layout wrapper cho từng vùng
│   ├── AuthLayout.tsx              # Login/Register — tối giản, không sidebar
│   ├── AdminLayout.tsx             # Super Admin — hoàn toàn khác biệt
│   ├── AppLayout.tsx               # Owner + Staff — sidebar + header chính
│   └── PosLayout.tsx               # POS bán hàng — fullscreen, tối ưu tablet
│
├── pages/                          # Các trang, phân nhóm theo role
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   │
│   ├── admin/                      # Chỉ ADMIN truy cập được
│   │   ├── DashboardPage.tsx
│   │   ├── PlansPage.tsx
│   │   └── TenantsPage.tsx
│   │
│   ├── owner/                      # Chỉ OWNER truy cập được
│   │   ├── DashboardPage.tsx
│   │   ├── BranchesPage.tsx
│   │   ├── StaffPage.tsx
│   │   ├── PermissionsPage.tsx
│   │   ├── MenuPage.tsx
│   │   ├── CategoryPage.tsx
│   │   ├── ToppingPage.tsx
│   │   ├── RecipePage.tsx
│   │   ├── VouchersPage.tsx
│   │   ├── SuppliersPage.tsx
│   │   └── reports/
│   │       ├── RevenuePage.tsx
│   │       ├── InventoryReportPage.tsx
│   │       └── HRReportPage.tsx
│   │
│   ├── shared/                     # OWNER + STAFF đều truy cập (UI có thể khác)
│   │   ├── inventory/
│   │   │   ├── IngredientPage.tsx
│   │   │   ├── SemiProductPage.tsx
│   │   │   ├── StockEntryPage.tsx
│   │   │   ├── StockExitPage.tsx
│   │   │   └── StockTakingPage.tsx
│   │   └── shifts/
│   │       ├── ShiftSchedulePage.tsx   # Manager xếp lịch
│   │       └── MyShiftPage.tsx         # Staff xem lịch của mình
│   │
│   └── pos/                        # Giao diện POS bán hàng
│       ├── SelectBranchPage.tsx    # Chọn chi nhánh làm việc
│       ├── OrderPage.tsx           # Màn hình tạo đơn chính
│       ├── TableMapPage.tsx        # Sơ đồ bàn real-time
│       └── PaymentPage.tsx         # Thanh toán
│
├── modules/                        # Logic nghiệp vụ theo từng module
│   │                               # Mỗi module tự chứa: component, hook, service, type
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── OTPInput.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   └── useRegister.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── stores/
│   │   │   └── authStore.ts        # Zustand store
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── branch/
│   │   ├── components/
│   │   │   ├── BranchCard.tsx
│   │   │   ├── BranchForm.tsx
│   │   │   └── BranchTable.tsx
│   │   ├── hooks/
│   │   │   ├── useBranches.ts      # TanStack Query hooks
│   │   │   └── useCreateBranch.ts
│   │   ├── services/
│   │   │   └── branchService.ts
│   │   └── types/
│   │       └── branch.types.ts
│   │
│   ├── staff/
│   ├── menu/
│   ├── order/
│   │   ├── components/
│   │   │   ├── MenuGrid.tsx        # Lưới chọn món
│   │   │   ├── CartPanel.tsx       # Giỏ hàng bên phải
│   │   │   ├── OrderCard.tsx
│   │   │   └── KDSTicket.tsx       # Kitchen Display
│   │   ├── hooks/
│   │   │   ├── useOrders.ts
│   │   │   └── useOrderRealtime.ts # Socket.io hook
│   │   ├── services/
│   │   │   └── orderService.ts
│   │   └── types/
│   │       └── order.types.ts
│   │
│   ├── inventory/
│   ├── payment/
│   ├── voucher/
│   ├── supplier/
│   └── report/
│
├── shared/                         # Dùng chung toàn app
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (KHÔNG sửa trực tiếp)
│   │   │   ├── button.tsx          # Generated by shadcn CLI
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Sidebar render menu theo role
│   │   │   ├── Header.tsx          # Header với branch selector
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── PageWrapper.tsx     # Wrapper chuẩn hóa padding/heading
│   │   └── common/
│   │       ├── DataTable.tsx       # Table tái sử dụng với pagination
│   │       ├── SearchBar.tsx
│   │       ├── StatusBadge.tsx     # Badge màu theo trạng thái
│   │       ├── ConfirmDialog.tsx   # Dialog xác nhận xóa/hủy
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/
│   │   ├── usePermission.ts        # Kiểm tra quyền: isOwner, isStaff, can()
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   └── useToast.ts
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts       # formatVND(10000) → "10.000 ₫"
│   │   ├── formatDate.ts
│   │   ├── cn.ts                   # clsx + tailwind-merge helper
│   │   └── getRoleHomePage.ts      # admin→/admin, owner→/dashboard, staff→/pos
│   │
│   ├── constants/
│   │   ├── roles.ts                # export const ROLES = { ADMIN, OWNER, STAFF }
│   │   ├── routes.ts               # export const ROUTES = { LOGIN: '/login', ... }
│   │   └── queryKeys.ts            # TanStack Query keys tập trung
│   │
│   └── types/
│       ├── api.types.ts            # ApiResponse<T>, PaginatedResult<T>, ApiError
│       └── common.types.ts         # Role, Status enums dùng chung
│
├── lib/
│   ├── axios.ts                    # Axios instance + interceptor (token + tenant_id)
│   ├── queryClient.ts              # TanStack Query client config
│   └── socket.ts                  # Socket.io client instance
│
└── providers/
    ├── AuthProvider.tsx            # Khởi tạo auth state khi app load
    ├── TenantProvider.tsx          # Thông tin tenant hiện tại
    └── BranchProvider.tsx          # Chi nhánh đang làm việc (session context)
```

---

## 🔀 Routing Architecture

### Sơ đồ luồng routing

```
Người dùng truy cập URL
         ↓
  ProtectedRoute
         ↓
  ┌──────────────────────────────────────┐
  │  Chưa đăng nhập?  → /login          │
  │                                      │
  │  Đã đăng nhập, kiểm tra role:        │
  │                                      │
  │  role = 'admin'  → AdminLayout       │  ← Hoàn toàn khác
  │  role = 'owner'  → AppLayout (full)  │  ← Sidebar đầy đủ
  │  role = 'staff'  → AppLayout (slim)  │  ← Sidebar rút gọn
  │                    hoặc PosLayout    │  ← Tùy route
  └──────────────────────────────────────┘
```

### `routes/index.tsx` — cấu trúc router

```tsx
// src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  // ── PUBLIC ROUTES (không cần auth) ──────────────────────────
  {
    element: <AuthLayout />,
    children: publicRoutes,
    // → /login, /register, /forgot-password
  },

  // ── ADMIN ROUTES (hoàn toàn riêng biệt) ─────────────────────
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [{
      element: <AdminLayout />,
      children: adminRoutes,
      // → /admin/dashboard, /admin/plans, /admin/tenants
    }],
  },

  // ── OWNER ROUTES ─────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['owner']} />,
    children: [{
      element: <AppLayout />,
      children: ownerRoutes,
      // → /dashboard, /branches, /staff, /menu, /inventory, ...
    }],
  },

  // ── STAFF ROUTES ─────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['staff']} />,
    children: [{
      element: <AppLayout />,
      children: staffRoutes,
      // → /my-shifts, /inventory (limited), ...
    }],
  },

  // ── POS ROUTES (owner + staff đều dùng) ──────────────────────
  {
    element: <ProtectedRoute allowedRoles={['owner', 'staff']} />,
    children: [{
      element: <PosLayout />,
      children: posRoutes,
      // → /pos/select-branch, /pos/orders, /pos/tables, /pos/payment
    }],
  },

  // ── FALLBACK ─────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
```

### `routes/ProtectedRoute.tsx`

```tsx
// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/stores/authStore';
import { getRoleHomePage } from '@/shared/utils/getRoleHomePage';
import type { Role } from '@/shared/types/common.types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

/**
 * Guard kiểm tra:
 * 1. Người dùng đã đăng nhập chưa?
 * 2. Role có được phép truy cập route này không?
 */
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <FullPageSpinner />;

  // Chưa đăng nhập → về trang login
  if (!user) return <Navigate to="/login" replace />;

  // Role phù hợp → render children routes
  if (allowedRoles.includes(user.role)) return <Outlet />;

  // Role không phù hợp → redirect về trang home của role đó
  return <Navigate to={getRoleHomePage(user.role)} replace />;
};
```

### `routes/RoleGuard.tsx` — dùng inline trong component

```tsx
// src/routes/RoleGuard.tsx
import { usePermission } from '@/shared/hooks/usePermission';
import type { Role } from '@/shared/types/common.types';

interface RoleGuardProps {
  roles: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Dùng trong JSX để ẩn/hiện component theo role.
 * Khác ProtectedRoute — cái này không redirect, chỉ ẩn UI.
 *
 * @example
 * <RoleGuard roles={['owner']}>
 *   <Button>Xóa nhân viên</Button>
 * </RoleGuard>
 */
export const RoleGuard = ({ roles, fallback = null, children }: RoleGuardProps) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
};
```

---

## 🏗️ Quy tắc tổ chức Module

Mỗi module trong `src/modules/` có cấu trúc chuẩn sau:

```
modules/[tên-module]/
├── components/         # UI components thuộc module này
├── hooks/              # Custom hooks (TanStack Query + logic)
├── services/           # Hàm gọi API (axios)
├── stores/             # Zustand store (nếu cần global state)
└── types/              # TypeScript types/interfaces
```

### Nguyên tắc module:
- **Tự chứa (Self-contained):** Component chỉ import từ module của mình hoặc từ `shared/`
- **Không import chéo module:** `modules/order` không được import từ `modules/staff`
- **Service chỉ gọi API:** Không chứa business logic, không gọi store khác
- **Hook là điểm trung gian:** Hook gọi service và cập nhật state/cache

---

## 🔌 API & Data Fetching

### Axios instance (`src/lib/axios.ts`)

```typescript
// Interceptor tự động gắn headers vào MỌI request:
// Authorization: Bearer <token>
// X-Tenant-ID: <tenantId>
// X-Branch-ID: <branchId>  (nếu đã chọn chi nhánh)
```

### TanStack Query conventions

```typescript
// Query keys tập trung tại src/shared/constants/queryKeys.ts
export const QUERY_KEYS = {
  branches: {
    all: ['branches'] as const,
    list: (params?: BranchParams) => ['branches', 'list', params] as const,
    detail: (id: string) => ['branches', 'detail', id] as const,
  },
  staff: { ... },
  menu: { ... },
};

// Hook pattern chuẩn
export const useBranches = (params?: BranchParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.branches.list(params),
    queryFn: () => branchService.getList(params),
  });
};
```

---

## 🗄️ State Management

| Loại state | Giải pháp | Vị trí |
|------------|-----------|--------|
| Auth (user, token) | Zustand | `modules/auth/stores/authStore.ts` |
| Server data (danh sách, chi tiết) | TanStack Query | Trong hooks của từng module |
| Branch đang làm việc | Zustand + Context | `providers/BranchProvider.tsx` |
| UI state (modal open, tab active) | `useState` local | Trong component |
| Form state | React Hook Form | Trong form component |

---

## 🎨 UI & Styling

### shadcn/ui
- Components nằm tại `src/shared/components/ui/` — **KHÔNG sửa trực tiếp**
- Thêm component mới: chạy `npx shadcn-ui@latest add [component]`
- Customize qua `className` prop và Tailwind utilities

### Tailwind
- Dùng `cn()` utility từ `src/shared/utils/cn.ts` để merge class có điều kiện
- Không dùng inline style trừ khi giá trị dynamic (vd: width từ JS)

---

## 📁 Path Aliases

```typescript
// tsconfig.json — các alias đã cấu hình
{
  "@/*": ["./src/*"],
  "@modules/*": ["./src/modules/*"],
  "@pages/*": ["./src/pages/*"],
  "@shared/*": ["./src/shared/*"],
  "@lib/*": ["./src/lib/*"],
}

// Cách dùng
import { usePermission } from '@shared/hooks/usePermission';
import { LoginForm } from '@modules/auth/components/LoginForm';
```

---

## 📄 Danh sách routes đầy đủ

### Public routes (`/`)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/login` | `LoginPage` | Đăng nhập |
| `/register` | `RegisterPage` | Đăng ký chủ quán mới |
| `/forgot-password` | `ForgotPasswordPage` | Quên mật khẩu |

### Admin routes (`/admin/*`)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/admin/dashboard` | `admin/DashboardPage` | Dashboard tổng quan |
| `/admin/plans` | `admin/PlansPage` | Quản lý gói dịch vụ |
| `/admin/tenants` | `admin/TenantsPage` | Danh sách tenant |

### Owner routes
| Path | Component | Mô tả |
|------|-----------|-------|
| `/dashboard` | `owner/DashboardPage` | Dashboard chủ quán |
| `/branches` | `owner/BranchesPage` | Quản lý chi nhánh |
| `/staff` | `owner/StaffPage` | Quản lý nhân viên |
| `/staff/permissions` | `owner/PermissionsPage` | Phân quyền |
| `/menu` | `owner/MenuPage` | Quản lý thực đơn |
| `/menu/categories` | `owner/CategoryPage` | Danh mục |
| `/menu/toppings` | `owner/ToppingPage` | Topping |
| `/menu/recipes` | `owner/RecipePage` | Công thức |
| `/vouchers` | `owner/VouchersPage` | Voucher khuyến mãi |
| `/suppliers` | `owner/SuppliersPage` | Nhà cung cấp |
| `/reports/revenue` | `owner/reports/RevenuePage` | Báo cáo doanh thu |
| `/reports/inventory` | `owner/reports/InventoryReportPage` | Báo cáo kho |
| `/reports/hr` | `owner/reports/HRReportPage` | Báo cáo nhân sự |

### Shared routes (Owner + Staff)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/inventory` | `shared/inventory/IngredientPage` | Nguyên liệu |
| `/inventory/semi-products` | `shared/inventory/SemiProductPage` | Bán thành phẩm |
| `/inventory/entries` | `shared/inventory/StockEntryPage` | Phiếu nhập kho |
| `/inventory/exits` | `shared/inventory/StockExitPage` | Phiếu xuất kho |
| `/inventory/stocktaking` | `shared/inventory/StockTakingPage` | Kiểm kho |
| `/shifts` | `shared/shifts/ShiftSchedulePage` | Lịch ca (manager xếp) |
| `/my-shifts` | `shared/shifts/MyShiftPage` | Lịch ca của tôi |

### POS routes (`/pos/*`)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/pos/select-branch` | `pos/SelectBranchPage` | Chọn chi nhánh làm việc |
| `/pos/orders` | `pos/OrderPage` | Màn hình tạo đơn POS |
| `/pos/tables` | `pos/TableMapPage` | Sơ đồ bàn |
| `/pos/payment/:orderId` | `pos/PaymentPage` | Thanh toán đơn |
