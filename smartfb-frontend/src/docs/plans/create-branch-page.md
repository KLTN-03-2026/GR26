# Plan: Chuyển modal tạo Branch sang trang riêng

**Status:** ✅ DONE
**Ngày bắt đầu:** 27/03/2026
**Ngày hoàn thành:** 27/03/2026
**Assignee:** @hoang

## Mô tả
Chuyển đổi form tạo chi nhánh từ modal (CreateBranchDialog) sang một trang riêng biệt `/owner/branches/new` để có trải nghiệm tốt hơn, dễ quản lý form phức tạp 3 bước.

## Tiếp cận
- **Giữ lại** `CreateBranchDialog` — không xóa, phòng trường hợp cần dùng lại
- **Clone logic** từ dialog sang trang mới, tái sử dụng các step components hiện có
- Tạo trang `CreateBranchPage.tsx` với full wizard form

## Files sẽ tạo/sửa

### Tạo mới
- [x] `src/pages/owner/CreateBranchPage.tsx` — trang tạo chi nhánh mới (3 steps)
- [x] `src/docs/plans/create-branch-page.md` — file plan này

### Sửa
- [x] `src/App.tsx` — thêm route `/owner/branches/new` → CreateBranchPage
- [x] `src/pages/owner/BranchesPage.tsx` — thay nút "Thêm chi nhánh" dẫn sang trang mới
- [x] `src/shared/constants/routes.ts` — thêm route BRANCHES_NEW

## Checklist
- [x] Tạo trang CreateBranchPage với đầy đủ 3 steps
- [x] Tái sử dụng Step1BasicInfo, Step2Operations, Step3Confirmation
- [x] Giữ nguyên validation schema (step1Schema, step2Schema, step3Schema)
- [x] Xử lý navigation (Back/Tiếp theo/Hoàn thành)
- [x] Xử lý redirect sau khi tạo thành công → quay lại `/owner/branches` + toast
- [x] Thêm route vào App.tsx
- [x] Cập nhật BranchesPage: nút "Thêm chi nhánh" thành link/tranition sang trang mới
- [x] Xử lý loading state, success/error toast
- [x] Xử lý cancel/discard khi đang dở form (confirm trước khi hủy)

## Ghi chú / Vấn đề

### Logic cần giữ nguyên từ dialog:
1. **3 steps wizard** với Stepper component
2. **Validation per step** dùng Zod schemas
3. **Form data state** quản lý toàn bộ formData
4. **Working schedule default** và các default values khác

### Khác biệt so với dialog:
- Không có `Dialog` wrapper → cần self-contained layout
- Cần **header riêng** với title + cancel button
- Cần **xử lý back navigation** (browser back button)
- Cần **toast notification** khi thành công/thất bại
- Có thể thêm **breadcrumb** để user biết đang ở đâu

### UI đề xuất:
```
┌─────────────────────────────────────────┐
│ ← Quay lại   Thêm chi nhánh mới         │
├─────────────────────────────────────────┤
│  [Stepper: 1. Thông tin → 2. Vận hành → 3. Xác nhận]  │
├─────────────────────────────────────────┤
│                                         │
│         Form content (scrollable)       │
│                                         │
├─────────────────────────────────────────┤
│  [Hủy]              [Quay lại] [Tiếp]   │
└─────────────────────────────────────────┘
```

## Tiêu chí hoàn thành
- [x] Form hoạt động y hệt dialog (validation, step navigation, submit)
- [x] URL đúng `/owner/branches/new`
- [x] Submit thành công → redirect về `/owner/branches` + toast
- [x] Cancel/discarded → confirm nếu có dữ liệu chưa lưu
- [x] Responsive, scroll mượt mà
- [x] Không có lỗi TypeScript
