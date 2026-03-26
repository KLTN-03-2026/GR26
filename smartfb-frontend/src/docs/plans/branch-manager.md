# Plan: Branch Manager Page

**Status:** ✅ DONE
**Ngày bắt đầu:** 26/03/2026
**Ngày hoàn thành:** 26/03/2026
**Assignee:** @hoang

## Mô tả
Xây dựng trang quản lý chi nhánh (Branch Manager) với các tính năng:
- Hiển thị danh sách chi nhánh trong bảng (shadcn/ui)
- Tìm kiếm chi nhánh theo tên/địa chỉ
- Filter theo trạng thái (Mở cửa, Tạm nghỉ) và theo địa chỉ
- Hiển thị các tag filter đã chọn (có thể xóa)
- Hiển thị doanh thu, nhân sự, trạng thái hoạt động
- Pagination
- Nút thêm chi nhánh
- Header table có màu cream

## Files tạo/sửa
- [x] `src/data/branches.ts` — tách dữ liệu selector và table
- [x] `src/modules/branch/data/branchDetails.ts` — tạo mock data chi tiết chi nhánh
- [x] `src/modules/branch/types/branch.types.ts` — types cho Branch Manager
- [x] `src/modules/branch/hooks/useBranchFilters.ts` — hook quản lý filters
- [x] `src/modules/branch/components/FilterTag.tsx` — tag filter
- [x] `src/modules/branch/components/BranchFilterBar.tsx` — bar filter + search
- [x] `src/modules/branch/components/BranchTable.tsx` — table shadcn/ui
- [x] `src/shared/components/ui/table.tsx` — shadcn/ui table component
- [x] `src/pages/owner/BranchesPage.tsx` — trang chính
- [x] `src/App.tsx` — import BranchesPage
- [x] `package.json` — thêm @shadcn/ui

## Checklist
- [x] Cài đặt @shadcn/ui
- [x] Tạo/update types
- [x] Tạo hook quản lý filters
- [x] Tạo component FilterTag
- [x] Tạo component BranchFilterBar
- [x] Tạo shadcn/ui table component
- [x] Tạo component BranchTable
- [x] Tạo page BranchesPage với 3 stats cards
- [x] Update App.tsx
- [x] Build thành công ✓
- [x] Header table màu cream

## Ghi chú
- Dùng shadcn/ui Table component với header background cream
- Component structure: page > stats cards + BranchFilterBar + BranchTable
- Filter state store trong component context
- Mock data cho demo
- Tách biệt data: branches.ts cho combobox, branchDetails.ts cho table

