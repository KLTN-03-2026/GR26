# Plan: Owner & Staff Layout (Sidebar + Header)

**Status:** 🔄 IN PROGRESS
**Ngày bắt đầu:** 26/03/2026
**Ngày hoàn thành:**
**Assignee:** @hoang

## Mô tả
Implement layout chung cho Owner và Staff với Sidebar collapsible và Header dựa trên thiết kế Figma. Layout support role-based visibility (Owner thấy tất cả, Staff chỉ thấy chi nhánh được phân công).

## Files sẽ tạo/sửa
- [ ] `src/shared/components/layout/OwnerLayout.tsx` — Layout chính cho Owner
- [ ] `src/shared/components/layout/StaffLayout.tsx` — Layout cho Staff (giới hạn menu)
- [ ] `src/shared/components/layout/Sidebar.tsx` — Sidebar component với collapsible menu
- [ ] `src/shared/components/layout/Header.tsx` — Header component
- [ ] `src/shared/components/layout/index.ts` — Export components

## Checklist
- [x] Phân tích design từ Figma
- [ ] Tạo Sidebar component với collapsible menu
- [ ] Tạo Header component
- [ ] Tạo OwnerLayout wrapper
- [ ] Tạo StaffLayout wrapper
- [ ] Xử lý active state màu cam
- [ ] Xử lý role-based menu visibility
- [ ] Test responsive
- [ ] Update routes để dùng layout mới

## Ghi chú / Vấn đề
- Primary color: `#e8692a`
- Background: `#faf7f2`
- Menu items chia theo nhóm: Tổng Quan, Vận Hành, Thực đơn & kho, Nhân sự, Kinh doanh, Hệ thống
- Dropdown combobox chọn chi nhánh ở Header
