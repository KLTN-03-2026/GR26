/**
 * Mock data hoạt động gần đây cho trang Branch Detail
 */

export type ActivityLogType =
  | 'inventory'    // Nhập/xuất kho
  | 'order'        // Đơn hàng
  | 'alert'        // Cảnh báo
  | 'price'        // Thay đổi giá
  | 'attendance'   // Check-in/out
  | 'staff'        // Nhân sự
  | 'system';      // Hệ thống

export interface BranchActivityLog {
  id: string;
  type: ActivityLogType;
  title: string;
  timestamp: string;
  actor: {
    name: string;
    type: 'user' | 'system';
    avatar?: string;
  };
  metadata?: Record<string, string | number>;
}

export const branchActivityLogsMock: BranchActivityLog[] = [
  {
    id: 'log-1',
    type: 'inventory',
    title: 'Nhập kho nguyên liệu mới từ NCC ABC',
    timestamp: '2026-03-27T10:24:00Z',
    actor: {
      name: 'Quản lý Nam',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=manager-1',
    },
    metadata: {
      supplier: 'NCC ABC',
      items: '15',
    },
  },
  {
    id: 'log-2',
    type: 'order',
    title: 'Đơn hàng mới #ORD-1082 vừa được thanh toán',
    timestamp: '2026-03-27T10:15:00Z',
    actor: {
      name: 'Tự động',
      type: 'system',
    },
    metadata: {
      orderId: 'ORD-1082',
      amount: '125000',
    },
  },
  {
    id: 'log-3',
    type: 'alert',
    title: 'Sản phẩm "Cà phê muối" sắp hết nguyên liệu (Hạt Arabica)',
    timestamp: '2026-03-27T09:45:00Z',
    actor: {
      name: 'Hệ thống',
      type: 'system',
    },
    metadata: {
      product: 'Cà phê muối',
      ingredient: 'Hạt Arabica',
    },
  },
  {
    id: 'log-4',
    type: 'price',
    title: 'Chỉnh sửa giá sản phẩm "Trà lài đặc thơm"',
    timestamp: '2026-03-27T08:30:00Z',
    actor: {
      name: 'Admin',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=admin',
    },
    metadata: {
      product: 'Trà lài đặc thơm',
      oldPrice: '45000',
      newPrice: '49000',
    },
  },
  {
    id: 'log-5',
    type: 'attendance',
    title: 'Mở ca làm việc sáng (6 nhân sự check-in)',
    timestamp: '2026-03-27T07:05:00Z',
    actor: {
      name: 'Lê Hồng Nhung',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=s8',
    },
    metadata: {
      shift: 'Ca Sáng',
      checkedIn: '6',
    },
  },
  {
    id: 'log-6',
    type: 'staff',
    title: 'Thêm nhân viên mới: Nguyễn Văn A vào ca sáng',
    timestamp: '2026-03-26T16:30:00Z',
    actor: {
      name: 'Quản lý Nam',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=manager-1',
    },
    metadata: {
      employee: 'Nguyễn Văn A',
      shift: 'Ca Sáng',
    },
  },
];
