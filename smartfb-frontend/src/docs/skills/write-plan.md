# 🗓️ AI Skill: Viết Feature Plan cho SmartF&B Frontend
> Chạy skill này TRƯỚC KHI CODE bất kỳ tính năng nào.
> Output: file `src/docs/plans/[tên-feature].md`

---

## 🎯 TRIGGER

Skill này kích hoạt khi developer nói:
- "Tôi muốn implement [tính năng X]"
- "Viết plan cho [X]"
- "Trước khi code [X], lên kế hoạch đi"
- "Tôi cần làm [X] cho module [Y]"

---

## 📋 QUY TRÌNH THỰC HIỆN

### Bước 1: Phân tích yêu cầu
Trích xuất từ mô tả của developer:
- **Tên tính năng** và **module** liên quan
- **Role nào** sẽ dùng tính năng này
- **Pages/Components** cần tạo hoặc sửa
- **API endpoints** sẽ gọi (tra `frontend_api_integration.md`)
- **State** cần quản lý (local, TanStack Query, hay Zustand)

### Bước 2: Tạo file plan
Tạo folder `dd-mm-yyyy` mỗi ngày khi có plan thì tạo folder theo ngày 
Folder của ngày đó sẽ chứa tất cả plan của ngày đó 
Tạo file `src/docs/plans/stt-[tên-kebab].md` theo đúng template dưới đây.

### Bước 3: Nêu rõ câu hỏi cần xác nhận
Trước khi code, liệt kê các điểm còn mơ hồ ,vấn đề thực tế có thể xảy ra.

---

## 📄 TEMPLATE FEATURE PLAN

```markdown
# Plan: [Tên tính năng]

**Status:** 🔄 IN PROGRESS
**Module:** [tên module]
**Role sử dụng:** [admin | owner | staff | all]
**Ngày bắt đầu:** DD/MM/YYYY
**Assignee:** @tên

---

## Mô tả
[Mô tả ngắn gọn tính năng làm gì, user nào dùng, giá trị mang lại]

---

## Vị trí trong cấu trúc thư mục

### Files tạo mới
- [ ] `src/modules/[module]/types/[name].types.ts`
- [ ] `src/modules/[module]/services/[name]Service.ts`
- [ ] `src/modules/[module]/hooks/use[Name].ts`
- [ ] `src/modules/[module]/hooks/useCreate[Name].ts`
- [ ] `src/modules/[module]/components/[Name]Table.tsx`
- [ ] `src/modules/[module]/components/[Name]Form.tsx`
- [ ] `src/pages/[role]/[Name]Page.tsx`

### Files sửa đổi
- [ ] `src/routes/[role]Routes.tsx` — thêm route mới
- [ ] `src/shared/constants/queryKeys.ts` — thêm query keys
- [ ] `src/shared/constants/routes.ts` — thêm path constant
- [ ] `src/shared/components/layout/Sidebar.tsx` — thêm menu item (nếu cần)

---

## API Endpoints sẽ dùng
| Method | Endpoint | Hook | Mô tả |
|--------|----------|------|-------|
| GET | `/api/v1/[resource]` | `use[Name]List` | Lấy danh sách |
| GET | `/api/v1/[resource]/:id` | `use[Name]Detail` | Chi tiết |
| POST | `/api/v1/[resource]` | `useCreate[Name]` | Tạo mới |
| PUT | `/api/v1/[resource]/:id` | `useUpdate[Name]` | Cập nhật |

---

## State Management
- **Server state (TanStack Query):** danh sách, chi tiết item
- **Local state (useState):** modal open/close, search input, active tab
- **Global state (Zustand):** [nếu cần — thường không cần cho CRUD thông thường]

---

## Checklist triển khai
### 1. Foundation
- [ ] Khai báo TypeScript interfaces trong `types/`
- [ ] Tạo service functions trong `services/`
- [ ] Thêm query keys vào `queryKeys.ts`
- [ ] Thêm route constant vào `routes.ts`

### 2. Data Layer
- [ ] Hook query (list + detail)
- [ ] Hook mutation (create + update + delete/toggle)

### 3. UI Components
- [ ] Component hiển thị danh sách (Table hoặc Grid)
- [ ] Form component (React Hook Form + Zod schema)
- [ ] Dialog wrapper (create/edit dùng chung form)
- [ ] ConfirmDialog cho delete/toggle

### 4. Page Integration
- [ ] Trang chính (Page component)
- [ ] Thêm route vào routesFile
- [ ] Thêm vào Sidebar nếu cần

### 5. Quality
- [ ] Loading state (Skeleton)
- [ ] Error state (ErrorState component)
- [ ] Empty state (EmptyState component với message ngữ cảnh)
- [ ] Toast thông báo thành công/lỗi bằng tiếng Việt
- [ ] RoleGuard ẩn/hiện button theo quyền

---

## Ghi chú / Vấn đề gặp phải
- [ghi chú nếu có]

---

## Câu hỏi cần xác nhận
- [ ] Q1: [điểm mơ hồ cần hỏi]
- [ ] Q2: [edge case chưa rõ xử lý thế nào]
```

---

## 📌 VÍ DỤ ĐẦY ĐỦ — "Tính năng quản lý nhân viên"

```markdown
# Plan: Quản lý nhân viên (Staff CRUD)

**Status:** 🔄 IN PROGRESS
**Module:** staff
**Role sử dụng:** owner (full), branch_manager (chi nhánh mình)
**Ngày bắt đầu:** 15/03/2026
**Assignee:** @hoang

---

## Mô tả
Cho phép Owner và Branch Manager xem danh sách nhân viên, thêm mới, chỉnh sửa thông tin,
cấp PIN POS, và vô hiệu hóa tài khoản. Owner thấy tất cả nhân viên toàn tenant;
Branch Manager chỉ thấy nhân viên trong chi nhánh được phân công.

---

## Vị trí trong cấu trúc thư mục

### Files tạo mới
- [ ] `src/modules/staff/types/staff.types.ts`
- [ ] `src/modules/staff/services/staffService.ts`
- [ ] `src/modules/staff/hooks/useStaff.ts`
- [ ] `src/modules/staff/hooks/useCreateStaff.ts`
- [ ] `src/modules/staff/hooks/useUpdateStaff.ts`
- [ ] `src/modules/staff/hooks/useToggleStaff.ts`
- [ ] `src/modules/staff/hooks/useResetPin.ts`
- [ ] `src/modules/staff/components/StaffTable.tsx`
- [ ] `src/modules/staff/components/StaffForm.tsx`
- [ ] `src/modules/staff/components/PinSetupModal.tsx`
- [ ] `src/pages/owner/StaffPage.tsx`

### Files sửa đổi
- [ ] `src/routes/ownerRoutes.tsx` — thêm route /staff
- [ ] `src/shared/constants/queryKeys.ts` — thêm staff keys
- [ ] `src/shared/constants/routes.ts` — thêm ROUTES.STAFF

---

## API Endpoints sẽ dùng
| Method | Endpoint | Hook | Mô tả |
|--------|----------|------|-------|
| GET | `/api/v1/staff` | `useStaffList` | Danh sách nhân viên |
| GET | `/api/v1/staff/:id` | `useStaffDetail` | Chi tiết nhân viên |
| POST | `/api/v1/staff` | `useCreateStaff` | Tạo nhân viên mới |
| PUT | `/api/v1/staff/:id` | `useUpdateStaff` | Cập nhật thông tin |
| PUT | `/api/v1/staff/:id/toggle` | `useToggleStaff` | Kích hoạt/vô hiệu hóa |
| PUT | `/api/v1/staff/:id/reset-pin` | `useResetPin` | Reset PIN POS |

---

## State Management
- **Server state:** danh sách nhân viên, chi tiết (TanStack Query)
- **Local state:** modal open, form state, search/filter input
- **Global:** không cần Zustand

---

## Checklist triển khai
### 1. Foundation
- [ ] Staff, Position interfaces + CreateStaffPayload, StaffFilters
- [ ] staffService: getList, getById, create, update, toggle, resetPin
- [ ] Query keys: staff.all, staff.list(params), staff.detail(id)

### 2. Data Layer
- [ ] useStaffList với filter (search, role, branchId, status)
- [ ] useStaffDetail
- [ ] useCreateStaff → invalidate staff.all + toast thành công
- [ ] useUpdateStaff → invalidate staff.detail + staff.list
- [ ] useToggleStaff → confirm dialog trước + invalidate
- [ ] useResetPin → modal nhập PIN mới

### 3. UI Components
- [ ] StaffTable: columns (tên, SĐT, vai trò, chi nhánh, trạng thái, thao tác)
- [ ] StaffForm: tên, SĐT, email, vai trò dropdown, chi nhánh multi-select
- [ ] Zod schema validate: SĐT regex 0xxxxxxxxx, tên min 2 ký tự
- [ ] PinSetupModal: input PIN ẩn 4-6 số + xác nhận lại PIN
- [ ] ConfirmDialog khi toggle active/inactive

### 4. Page Integration
- [ ] StaffPage: SearchBar + filter role/status + DataTable + CreateStaffDialog
- [ ] RoleGuard ẩn nút "Xóa/Vô hiệu hóa" với branch_manager
- [ ] Thêm route /staff vào ownerRoutes.tsx

### 5. Quality
- [ ] Skeleton loading khi fetch danh sách
- [ ] Empty state: "Chưa có nhân viên nào. Nhấn 'Thêm nhân viên' để bắt đầu."
- [ ] Toast tiếng Việt cho tất cả mutation

---

## Câu hỏi cần xác nhận
- [ ] Q1: Khi branch_manager tạo nhân viên, nhân viên đó tự động được gán vào chi nhánh của manager không?
- [ ] Q2: Reset PIN thì nhân viên có nhận thông báo gì không (SMS/email)?
- [ ] Q3: Có trang chi tiết nhân viên riêng hay chỉ dùng Dialog?
```
