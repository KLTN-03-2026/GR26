# Frontend Architecture — SmartF&B

> Stack: **Vite + React 19 + TypeScript**  
> Ngôn ngữ: TypeScript (strict mode)  
> UI Library: Shadcn/UI + Tailwind CSS v4  
> State: Zustand (local) + React Query (server state)  
> HTTP: Axios (custom instance)  
> Realtime: Socket.io client

---

## Tổng quan cấu trúc `src/`

```
src/
├── app/          # Routing & page-level components
├── assets/       # Static files (images, fonts, icons)
├── lib/          # Third-party library configurations
├── modules/      # Feature modules (business logic theo domain)
├── providers/    # React Context providers
└── shared/       # Code dùng chung toàn app
```

---

## Chi tiết từng folder

### `app/` — Routing & Pages

Chứa **các trang** tổ chức theo nhóm route (route groups). Mỗi folder con là một page hoặc group layout.

```
app/
├── (auth)/               # Không dùng layout chính (no sidebar)
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (admin)/              # Layout Super Admin
│   └── plans/
├── (owner)/              # Layout Owner dashboard
│   ├── dashboard/
│   ├── branches/
│   ├── staff/
│   ├── menu/
│   ├── inventory/
│   ├── suppliers/
│   ├── vouchers/
│   └── reports/
└── (pos)/                # Layout POS bán hàng
    ├── orders/
    ├── tables/
    └── payment/
```

**Quy tắc:**
- Mỗi page chỉ chứa UI composition (kết hợp components từ `modules/`).
- Không đặt business logic ở đây — logic nằm ở `modules/`.
- Mỗi folder page nên có: `index.tsx` (page component) + (tuỳ chọn) `layout.tsx`.

---

### `modules/` — Feature Modules (Business Logic)

Mỗi module tương ứng với một **domain nghiệp vụ**. Cấu trúc nội bộ thống nhất:

```
modules/
├── auth/
│   ├── components/     # LoginForm, RegisterForm, OTPInput
│   ├── hooks/          # useLogin, useRegister, useCurrentUser
│   ├── services/       # authService.ts — các hàm gọi API
│   ├── stores/         # authStore.ts — Zustand store
│   └── types/          # User, LoginPayload, AuthState...
├── branch/
├── staff/
├── menu/
├── order/
├── inventory/
├── payment/
├── voucher/
├── supplier/
└── report/
```

**Quy tắc:**
- `components/`: UI chỉ dùng trong module đó (form, card, list...).
- `hooks/`: custom hooks, thường wrap React Query (`useQuery`, `useMutation`).
- `services/`: hàm async gọi API qua axios instance từ `lib/axios.ts`.
- `stores/`: Zustand store nếu cần global state trong module.
- `types/`: TypeScript types/interfaces cho domain này.
- **Không import chéo giữa modules** (tránh circular dependency).

---

### `shared/` — Code Dùng Chung

```
shared/
├── components/
│   ├── ui/           # Shadcn/UI components (Button, Input, Dialog, Table...)
│   ├── layout/       # Sidebar, Header, PageWrapper, Breadcrumb
│   └── common/       # SearchBar, StatusBadge, EmptyState, Pagination
├── hooks/            # useDebounce, usePagination, usePermission, useMediaQuery
├── utils/            # formatCurrency, formatDate, cn(), slugify...
├── constants/        # ROLES, STATUS_MAP, ROUTE_PATHS, API_ENDPOINTS
└── types/            # ApiResponse<T>, PaginatedResult<T>, SelectOption...
```

**Quy tắc:**
- `ui/`: Source code Shadcn components — **có thể sửa trực tiếp** để fit design system.
- `layout/`: Các component bọc layout (dùng trong `app/`).
- `common/`: Components nhỏ tái sử dụng nhưng có nghiệp vụ (ví dụ `StatusBadge` dùng `STATUS_MAP`).
- `constants/`: Các hằng số, enum, mapping — **không đặt magic string rải rác**.
- `types/`: Generic types dùng toàn app.

---

### `lib/` — Cấu Hình Thư Viện

```
lib/
├── axios.ts          # Axios instance: baseURL, interceptors (attach token, tenant_id)
├── queryClient.ts    # React Query QueryClient config (staleTime, retry...)
└── socket.ts         # Socket.io client — connect, event types
```

**Quy tắc:**
- Chỉ chứa **config/setup** của 3rd-party libraries.
- `axios.ts` export một singleton instance — tất cả `services/` import từ đây.
- Không đặt business logic ở đây.

---

### `providers/` — React Context Providers

```
providers/
├── AuthProvider.tsx      # Quản lý auth state (user, token, permissions)
├── TenantProvider.tsx    # Lưu thông tin tenant (restaurant brand) hiện tại
└── BranchProvider.tsx    # Lưu chi nhánh đang làm việc trong session
```

**Quy tắc:**
- Mỗi provider wrap một phần context cụ thể.
- Tất cả providers được compose trong `App.tsx` hoặc `main.tsx`.
- **Không** đặt complex logic trong provider — delegate sang store/service.

---

### `assets/` — Static Files

```
assets/
├── images/
├── icons/
└── fonts/
```

Import trực tiếp trong components:
```ts
import logo from '@/assets/images/logo.svg'
```

---

## Data Flow

```
Page (app/)
  └── Module Component (modules/*/components/)
        └── Custom Hook (modules/*/hooks/)
              ├── React Query → Service (modules/*/services/) → lib/axios.ts → API
              └── Zustand Store (modules/*/stores/ hoặc shared state)
```

---

## Naming Conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| Component file | PascalCase | `LoginForm.tsx` |
| Hook file | camelCase, prefix `use` | `useLogin.ts` |
| Service file | camelCase, suffix `Service` | `authService.ts` |
| Store file | camelCase, suffix `Store` | `authStore.ts` |
| Type/Interface | PascalCase | `LoginPayload`, `ApiResponse<T>` |
| Constant | SCREAMING_SNAKE_CASE | `ROUTE_PATHS`, `USER_ROLES` |
| CSS class (Tailwind) | kebab-case | *(managed by Tailwind)* |

---

## Import Alias

Tất cả import dùng `@/` thay vì đường dẫn tương đối:

```ts
// ✅ Đúng
import { Button } from '@/shared/components/ui/button'
import { authService } from '@/modules/auth/services/authService'
import { ROUTE_PATHS } from '@/shared/constants/routes'

// ❌ Tránh
import { Button } from '../../../shared/components/ui/button'
```

---

## Liên quan

- [Shadcn/UI Setup Guide](./shadcn-setup.md)
- [API Integration Guide](./api-integration.md) *(sắp có)*
- [State Management Guide](./state-management.md) *(sắp có)*
