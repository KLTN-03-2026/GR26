# AI Project Structure

Tài liệu này là bản đồ sơ bộ của repo `GR26` để cung cấp context nhanh cho AI trước khi đọc code chi tiết.

## 1. Mục tiêu dự án

`SmartF&B` là hệ thống quản lý F&B/POS theo hướng multi-tenant.

Repo hiện tại gồm:

- backend API bằng Spring Boot
- frontend web app bằng React + Vite
- tài liệu làm việc nhóm, báo cáo học phần và ảnh phục vụ demo/tài liệu

## 2. Cấu trúc repo cấp cao

```text
GR26/
├── Smartfnb-BE/          # Backend Spring Boot
├── smartfb-frontend/     # Frontend React + TypeScript + Vite
├── docs/                 # Tài liệu nhóm, prompt, audit, AI notes
├── reports/              # Báo cáo môn học / proposal / plan / backlog
├── images/               # Ảnh dùng cho tài liệu hoặc demo
├── README.md             # README tổng quan
└── AI_PROJECT_STRUCTURE.md
```

## 3. Stack chính

### Backend

- Java 21
- Spring Boot 3.3.5
- Spring Security
- Spring Data JPA
- PostgreSQL
- Redis
- Flyway
- SpringDoc Swagger
- Spring WebSocket
- Spring Modulith
- MapStruct

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router 7
- TanStack React Query
- Zustand
- Axios
- React Hook Form + Zod
- Radix UI / shadcn-style components

## 4. Backend hiện trạng

### 4.1 Entry points và cấu hình

- App entry: `Smartfnb-BE/src/main/java/com/smartfnb/SmartFnbApplication.java`
- Main config: `Smartfnb-BE/src/main/resources/application.yml`
- DB migrations: `Smartfnb-BE/src/main/resources/db/migration`
- Docker infra file: `Smartfnb-BE/docker-compose.yml`

Các điểm đáng chú ý:

- backend chạy mặc định ở cổng `8080`
- PostgreSQL và Redis là dependency hạ tầng chính
- Hibernate để `validate`, schema do Flyway quản lý
- bật virtual threads
- có Swagger tại `/swagger-ui.html`
- có upload local filesystem qua `app.storage.upload-dir`

### 4.2 Cách tổ chức package

Backend đang tổ chức theo module nghiệp vụ, mỗi module thường theo form:

```text
com.smartfnb.<module>/
├── web/                  # Controller, request DTO
├── application/          # Command, query, handler, response DTO
├── domain/               # Model, repository interface, event, exception
└── infrastructure/       # JPA, external adapter, websocket, event handler
```

Đây là hướng DDD + CQRS mức thực dụng, không phải monolith package-by-layer thuần túy.

### 4.3 Các module backend đã thấy trong source

- `auth`: đăng ký tenant, login, OTP, refresh token, chọn chi nhánh, PIN login
- `branch`: quản lý chi nhánh
- `plan`: plan/subscription/feature flags
- `staff`: nhân viên, role, position, permission matrix
- `shift`: ca làm, lịch, template
- `menu`: category, menu item, addon, branch item, recipe
- `inventory`: nhập kho, điều chỉnh, hao hụt, balance, low-stock events
- `supplier`: supplier và purchase order
- `order`: bàn, zone, order lifecycle, order detail, realtime updates
- `payment`: invoice, cash payment, QR payment, search invoice
- `rbac`: security và xử lý permission phụ trợ
- `shared`: config, exception, web helpers, storage, tenant context

### 4.4 Cross-cutting backend cần AI chú ý

- Multi-tenant là trọng tâm: nhiều controller và handler lấy `tenantId`, `branchId`, `userId`, `role` từ `TenantContext`
- JWT filter nằm trong `auth/infrastructure/jwt`, có populate và clear `TenantContext`
- `order` có WebSocket/STOMP broadcaster cho sơ đồ bàn và trạng thái đơn
- `inventory` lắng nghe event từ order để tự động trừ kho
- Flyway migration đang đi theo từng module:
  - `V1` init schema
  - `V3` menu
  - `V4` table
  - `V5` order
  - `V6` payment
  - `V7` inventory
  - `V8` staff
  - `V9` shift
  - `V10` supplier
  - `V11`, `V12` bổ sung permission/branch view/table permissions

## 5. Frontend hiện trạng

### 5.1 Entry points và cấu hình

- App entry: `smartfb-frontend/src/main.tsx`
- App shell: `smartfb-frontend/src/App.tsx`
- Route map: `smartfb-frontend/src/routes/routeConfig.tsx`
- Vite config: `smartfb-frontend/vite.config.ts`
- Env mẫu: `smartfb-frontend/.env.example`

Các điểm đáng chú ý:

- Vite đang proxy `/api` sang `http://localhost:8080`
- `.env.example` hiện vẫn ghi `VITE_API_BASE_URL=http://localhost:3000/api`
- khi AI làm việc với frontend, nên kiểm tra lại source thực tế thay vì tin hoàn toàn vào README hoặc `.env.example`

### 5.2 Cấu trúc `src`

```text
smartfb-frontend/src/
├── main.tsx
├── App.tsx
├── assets/
├── data/
├── layouts/
├── lib/                  # axios, queryClient
├── modules/              # business modules
├── pages/                # pages theo role
├── providers/
├── routes/
├── shared/               # ui, hooks, utils, constants, types
├── utils/
└── docs/                 # tài liệu kỹ thuật nằm trong src
```

### 5.3 Tổ chức frontend theo module

Phần lớn module trong `src/modules` bám theo pattern:

```text
modules/<module>/
├── components/
├── hooks/
├── services/
├── types/
├── stores/               # có ở một số module
├── schemas/              # có ở một số module
└── utils/                # có ở một số module
```

Các module frontend đã thấy:

- `auth`
- `branch`
- `staff`
- `menu`
- `recipe`
- `inventory`
- `supplier`
- `voucher`
- `table`
- `order`
- `payment`
- `report`

### 5.4 Tổ chức page và route

Frontend chia page theo role:

- `pages/auth`
- `pages/admin`
- `pages/owner`
- `pages/shared`
- `pages/pos`

Route đang chia thành:

- `publicRoutes`
- `adminRoutes`
- `ownerRoutes`
- `staffRoutes`
- `posRoutes`

Lưu ý hiện trạng:

- owner/staff/POS đã có khá nhiều page thật
- một số route vẫn đang dùng `PagePlaceholder`
- các route admin phần lớn mới ở mức placeholder
- supplier, promotions, reports, settings, packages phía owner chưa hoàn thiện page thật

### 5.5 Shared frontend

Các khu vực dùng lại nhiều:

- `shared/components/ui`: button, input, dialog, sheet, table, form, checkbox, radio-group...
- `shared/components/layout`: layout shell, header, mobile nav, brand logo
- `shared/components/common`: page meta, stepper, placeholder, numeric input...
- `shared/constants`: routes, roles, permissions, query keys
- `shared/utils`: access control, currency/date formatting, class merge
- `lib/axios.ts`: HTTP client
- `lib/queryClient.ts`: React Query config
- `modules/auth/stores/authStore.ts`: auth session store

## 6. Tài liệu và thư mục phụ trợ

### Root `docs/`

Đây là tài liệu nhóm ở cấp repo, hiện có:

- `docs/AI.md`
- `docs/bug-reports.md`
- `docs/NeuralProphet_Guide.md`
- thư mục dated notes như `docs/2026-04-09/...`

### Frontend `src/docs/`

Ngoài `docs/` ở root, frontend còn có `src/docs/` chứa:

- `plans`
- `dev-notes`
- `architecture`
- `api`
- `report`
- `skills`
- `sprint`
- `reports`

Điều này có nghĩa repo đang chứa cả code lẫn tài liệu nội bộ ngay trong cây source frontend.

### `reports/`

Chứa tài liệu học phần / báo cáo:

- project proposal
- project plan
- user story
- WBS
- raw docs

### `images/`

Chứa ảnh phục vụ tài liệu/demo.

## 7. Cách hiểu nhanh luồng hệ thống

### Backend

1. Request vào controller
2. Security/JWT xác thực và nạp `TenantContext`
3. Controller gọi command/query handler hoặc service application
4. Domain xử lý nghiệp vụ
5. Infrastructure lưu JPA, phát event, gọi adapter ngoài hoặc broadcast WebSocket

### Frontend

1. `App.tsx` mount routes
2. `ProtectedRoute` kiểm tra role/permission
3. Page gọi module hooks
4. Hooks gọi `services/*`
5. Service dùng `lib/axios.ts` để gọi API
6. State cục bộ dùng React Query/Zustand tùy mục đích

## 8. File nên đọc đầu tiên nếu là AI agent

Nếu cần nạp context nhanh, nên đọc theo thứ tự:

1. `README.md`
2. `Smartfnb-BE/pom.xml`
3. `Smartfnb-BE/src/main/resources/application.yml`
4. `Smartfnb-BE/src/main/java/com/smartfnb/SmartFnbApplication.java`
5. `smartfb-frontend/package.json`
6. `smartfb-frontend/vite.config.ts`
7. `smartfb-frontend/src/App.tsx`
8. `smartfb-frontend/src/routes/routeConfig.tsx`
9. module cụ thể đang cần sửa ở `Smartfnb-BE/src/main/java/com/smartfnb/<module>` hoặc `smartfb-frontend/src/modules/<module>`

## 9. Ghi chú cho AI trước khi chỉnh sửa

- Đây là repo đa phần theo hướng module hóa theo nghiệp vụ, không nên refactor về structure chung chung nếu chưa có lý do rõ ràng
- Multi-tenant và permission là ràng buộc quan trọng, cần kiểm tra `tenantId`, `branchId`, `role`, `permissions` trước khi sửa logic
- Không phải mọi module frontend đều hoàn thiện; có route đã khai báo nhưng page thật chưa có
- Repo có tài liệu nằm ở nhiều nơi, kể cả bên trong `smartfb-frontend/src/docs`
- Khi cần hiểu hành vi thực tế, ưu tiên đọc source hiện tại hơn README vì có chỗ cấu hình đã lệch nhau

## 10. Tóm tắt ngắn

Đây là một monorepo nhỏ cho hệ thống SmartF&B gồm:

- backend Spring Boot theo module nghiệp vụ và tư duy DDD/CQRS
- frontend React/Vite chia theo module + role-based pages
- hạ tầng local dùng PostgreSQL, Redis, Flyway
- nhiều module nghiệp vụ đã hiện diện: auth, branch, staff, menu, inventory, order, payment, supplier, shift...
- tài liệu học thuật và tài liệu nội bộ nằm song song với source code
