/**
 * Mock data hoạt động gần đây cho trang Staff Detail
 */

export type ActivityLogType =
  | 'attendance'    // Check-in/out
  | 'role_change'   // Thay đổi vị trí
  | 'shift_update'  // Cập nhật ca làm việc
  | 'document'      // Tải/cập nhật tài liệu
  | 'leave'         // Nghỉ phép
  | 'system';       // Hệ thống

export interface StaffActivityLog {
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

export const staffActivityLogsMock: StaffActivityLog[] = [
  {
    id: 'log-1',
    type: 'attendance',
    title: 'Check-in ca làm việc - Ca Sáng',
    timestamp: '2026-03-28T07:05:00Z',
    actor: {
      name: 'Hệ thống',
      type: 'system',
    },
    metadata: {
      shift: 'Ca Sáng',
      time: '07:05',
    },
  },
  {
    id: 'log-2',
    type: 'role_change',
    title: 'Thay đổi vị trí từ Waiter thành Supervisor',
    timestamp: '2026-03-25T14:30:00Z',
    actor: {
      name: 'Lê Văn Nam',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=manager-1',
    },
    metadata: {
      oldRole: 'Waiter',
      newRole: 'Supervisor',
    },
  },
  {
    id: 'log-3',
    type: 'shift_update',
    title: 'Cập nhật ca làm việc: Thêm Ca Tối',
    timestamp: '2026-03-22T10:15:00Z',
    actor: {
      name: 'Lê Văn Nam',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=manager-1',
    },
    metadata: {
      addedShift: 'Ca Tối',
      startTime: '17:00',
      endTime: '22:30',
    },
  },
  {
    id: 'log-4',
    type: 'document',
    title: 'Tải lên HĐLĐ',
    timestamp: '2026-03-20T09:45:00Z',
    actor: {
      name: 'Hệ thống',
      type: 'system',
    },
    metadata: {
      document: 'Hợp đồng lao động',
      fileName: 'hddld_staff1_2024.pdf',
    },
  },
  {
    id: 'log-5',
    type: 'leave',
    title: 'Xin phép nghỉ từ 28/03/2026 đến 30/03/2026',
    timestamp: '2026-03-18T16:20:00Z',
    actor: {
      name: 'Lê Văn Nam',
      type: 'user',
      avatar: 'https://i.pravatar.cc/150?u=staff-1',
    },
    metadata: {
      leaveType: 'Phép hưởng lương',
      days: '3',
    },
  },
];
