# Plan: Xây dựng trang chi tiết chi nhánh (Branch Detail Page)

**Status:** 🔄 IN PROGRESS
**Ngày bắt đầu:** 27/03/2026
**Ngày hoàn thành:**
**Assignee:** @hoangnguyen

## Mô tả
Xây dựng trang chi tiết chi nhánh theo design với mock data, bao gồm thông tin chi nhánh, hoạt động gần đây, và ca làm việc. Di chuyển lịch sử hoạt động từ trang danh sách vào trang chi tiết.



## Files sẽ tạo/sửa

### Tạo mới
- [ ] `src/pages/owner/BranchDetailPage.tsx` — Page chi tiết chi nhánh
- [ ] `src/modules/branch/components/branch-detail/BranchInfoCard.tsx` — Card thông tin chi nhánh (cover, mã, tên, địa chỉ, giờ hoạt động, manager)
- [ ] `src/modules/branch/components/branch-detail/ActivityLogSection.tsx` — Section hoạt động gần đây (dùng lại từ ActivityLogSection.tsx hiện tại)
- [ ] `src/modules/branch/components/branch-detail/ShiftScheduleSection.tsx` — Section ca làm việc (sáng, chiều, tối)
- [ ] `src/modules/branch/data/branchDetailMock.ts` — Mock data chi tiết cho 1 chi nhánh
- [ ] `src/modules/branch/data/shiftScheduleMock.ts` — Mock data ca làm việc
- [ ] `src/modules/branch/hooks/useBranchDetail.ts` — Hook lấy chi tiết chi nhánh

### Sửa
- [ ] `src/pages/owner/BranchesPage.tsx` — Xóa ActivityLogSection, thêm link vào bảng để qua trang chi tiết
- [ ] `src/modules/branch/components/BranchTable/BranchRow.tsx` — Thêm onClick để navigate sang trang chi tiết
- [ ] `src/shared/constants/routes.ts` — Thêm route `/branches/:id`

### Có thể xóa
- [ ] `src/modules/branch/components/ActivityLogSection.tsx` — Di chuyển vào folder branch-detail hoặc xóa nếu không dùng

## Checklist
- [ ] Tạo types cho BranchDetail (chi tiết đầy đủ hơn BranchDetail hiện tại)
- [ ] Tạo types cho ShiftSchedule (ca làm việc)
- [ ] Tạo mock data chi tiết cho 1 chi nhánh (theo design)
- [ ] Tạo mock data ca làm việc
- [ ] Tạo BranchInfoCard component (header với cover image, thông tin chi nhánh)
- [ ] Tạo ShiftScheduleSection component (3 ca: Sáng, Chiều, Tối)
- [ ] Tạo BranchDetailPage component (layout tổng thể)
- [ ] Thêm route vào React Router
- [ ] Cập nhật BranchesPage (xóa ActivityLogSection, thêm navigate)
- [ ] Test thủ công với mock data
- [ ] Xử lý loading states
- [ ] Xử lý error states (nếu branch không tồn tại)

## Chi tiết thiết kế (theo design image)

### 1. BranchInfoCard
- Cover image (banner ngang bo góc)
- Mã chi nhánh, Tên chi nhánh, Mã số thuế
- Địa chỉ, Giờ hoạt động, Điện thoại
- Manager info (avatar, tên, icon gọi/email)
- Nút "Chỉnh sửa" (header phải)

### 2. ActivityLogSection (Hoạt động gần đây)
- Tiêu đề "Hoạt động gần đây"
- Link "Xem tất cả" →
- List logs với icon theo action type:
  - 🚚 Nhập kho
  - 🛒 Đơn hàng mới
  - ⚠️ Cảnh báo nguyên liệu
  - ✏️ Chỉnh sửa giá
  - 👆 Check-in nhân sự
- Mỗi log: icon, tiêu đề, thời gian, người thực hiện

### 3. ShiftScheduleSection (Ca làm việc)
- 3 cards: Ca Sáng, Ca Chiều, Ca Tối
- Giờ ca làm việc
- Trạng thái: ĐANG DIỄN RA / SẮP TỚI / KẾT THÚC
- Nhân sự trong ca (avatars + số)
- Trưởng ca (tên)

## Mock data cần tạo

### Branch Detail
```typescript
{
  id: 'branch-1',
  code: 'BR-Q1-TXO1',
  name: 'ChuCha',
  taxCode: '23231241241234125',
  address: '266 Nguyễn Hoàng, Hải Châu, TP.Đà Nẵng',
  phone: '028 3930 4567',
  openTime: '07:00',
  closeTime: '22:30',
  coverImage: '/images/branch-cover-1.jpg',
  manager: {
    id: 'manager-1',
    name: 'Lê Văn Nam',
    avatar: '/avatars/manager-1.jpg',
  },
  status: 'active',
}
```

### Shift Schedule
```typescript
[
  {
    id: 'shift-1',
    name: 'Ca Sáng',
    startTime: '07:00',
    endTime: '12:00',
    status: 'ongoing', // 'ongoing' | 'upcoming' | 'ended'
    staff: [
      { id: 's1', name: 'Hoàng Anh', avatar: '/avatars/s1.jpg' },
      { id: 's2', name: '...', avatar: '/avatars/s2.jpg' },
    ],
    leader: { id: 's1', name: 'Hoàng Anh' },
  },
  // Ca Chiều, Ca Tối
]
```

### Activity Logs (chi tiết hơn cho branch)
```typescript
[
  {
    id: 'log-1',
    type: 'inventory', // 'inventory' | 'order' | 'alert' | 'price' | 'attendance'
    icon: 'truck',
    title: 'Nhập kho nguyên liệu mới từ NCC ABC',
    timestamp: '2026-03-27T10:24:00Z',
    actor: { name: 'Quản lý Nam', type: 'user' },
  },
  {
    id: 'log-2',
    type: 'order',
    icon: 'shopping-cart',
    title: 'Đơn hàng mới #ORD-1082 vừa được thanh toán',
    timestamp: '2026-03-27T10:15:00Z',
    actor: { name: 'Tự động', type: 'system' },
  },
  // ...
]
```

## Ghi chú / Vấn đề
- Chưa có API nên dùng hoàn toàn mock data
- ActivityLogSection hiện tại đang ở trang danh sách, cần di chuyển vào trang chi tiết
- Cần thêm breadcrumb navigation (Trang chủ > Chi nhánh > [Tên chi nhánh])
- Layout: 2 columns (trái: Activity Log, phải: Shift Schedule)
