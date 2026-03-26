# Plan: Refactor Form Tạo Chi Nhánh Theo Design

**Status:** ✅ DONE
**Ngày bắt đầu:** 26/03/2026
**Ngày hoàn thành:** 26/03/2026
**Assignee:** @hoang

## Mô tả
Refactor toàn bộ form tạo chi nhánh 3 bước theo design mẫu:
- Step 1: Thông tin cơ bản với layout 2 cột, section headers, upload area đẹp
- Step 2: Giờ hoạt động dạng bảng, toggle đồng bộ, integration cards
- Step 3: 2 cards song song (Thiết lập bàn + Thực đơn), summary section, notes section

## Files đã sửa

### Components
- [x] `src/shared/components/common/FormStepper.tsx` — Cập nhật styling với màu xanh lá cho completed step
- [x] `src/modules/branch/components/form-steps/Step1BasicInfo.tsx` — Refactor theo design 2 cột
- [x] `src/modules/branch/components/form-steps/Step2Operations.tsx` — Bảng giờ hoạt động, time input
- [x] `src/modules/branch/components/form-steps/Step3Confirmation.tsx` — 2 cards song song, summary grid
- [x] `src/modules/branch/components/CreateBranchDialog.tsx` — Layout dialog, footer buttons

### Thay đổi chính

#### FormStepper
- Step completed: màu xanh lá (#22c55e) với checkmark
- Step current: màu cam (#f97316)
- Step pending: màu xám
- Connector line đổi màu theo trạng thái

#### Step1BasicInfo
- Section header "THÔNG TIN CHI NHÁNH" uppercase
- Layout 2 cột cho tất cả fields
- Upload area với icon trong circle bg cam
- Focus ring màu cam
- Required note ở cuối

#### Step2Operations
- Toggle "Đồng bộ giờ từ Thứ Hai" ở header
- Bảng giờ hoạt động với border rounded
- Time input type="time" native
- Checkbox cho từng ngày
- Integration cards với logo G/S và toggle switch

#### Step3Confirmation
- 2 cards song song: Thiết lập bàn + Thiết lập thực đơn
- Border cam cho cards
- Radio options với select dropdown
- Summary section grid 3 cột
- "Lưu ý sau khi tạo" với green checkmarks

#### CreateBranchDialog
- Width tăng lên max-w-4xl
- Footer cố định với buttons styling
- Close button ở header
- Button "Tiếp theo" có icon arrow

## Checklist
- [x] Tạo types
- [x] Update FormStepper styling
- [x] Refactor Step1BasicInfo
- [x] Refactor Step2Operations
- [x] Refactor Step3Confirmation
- [x] Update CreateBranchDialog
- [x] Build thành công
- [x] Xử lý TypeScript errors

## Ghi chú / Vấn đề
- Design sử dụng màu cam (#f97316) làm primary color
- Time input dùng native type="time" để đơn giản
- Summary section cần được cập nhật khi form data thay đổi
- Integration với API cần thêm mock branches thực tế
