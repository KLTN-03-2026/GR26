/**
 * Mock data ca làm việc cho trang Staff Detail
 */

export interface ShiftStaff {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'ongoing' | 'upcoming' | 'ended';
  staff: ShiftStaff[];
  leader: ShiftStaff;
}

export const staffShiftScheduleMock: Shift[] = [
  {
    id: 'shift-1',
    name: 'Ca Sáng',
    startTime: '07:00',
    endTime: '12:00',
    status: 'ongoing',
    staff: [
      { id: 's1', name: 'Lê Văn Nam', avatar: 'https://i.pravatar.cc/150?u=s1', role: 'Manager' },
      { id: 's2', name: 'Trần Minh Thư', avatar: 'https://i.pravatar.cc/150?u=s2', role: 'Waiter' },
      { id: 's3', name: 'Phạm Tuấn Kiệt', avatar: 'https://i.pravatar.cc/150?u=s3', role: 'Chef' },
    ],
    leader: { id: 's1', name: 'Lê Văn Nam', avatar: 'https://i.pravatar.cc/150?u=s1' },
  },
  {
    id: 'shift-2',
    name: 'Ca Chiều',
    startTime: '12:00',
    endTime: '17:00',
    status: 'upcoming',
    staff: [
      { id: 's4', name: 'Nguyễn Phương Linh', avatar: 'https://i.pravatar.cc/150?u=s4', role: 'Cashier' },
      { id: 's5', name: 'Vũ Gia Huy', avatar: 'https://i.pravatar.cc/150?u=s5', role: 'Waiter' },
    ],
    leader: { id: 's4', name: 'Nguyễn Phương Linh', avatar: 'https://i.pravatar.cc/150?u=s4' },
  },
  {
    id: 'shift-3',
    name: 'Ca Tối',
    startTime: '17:00',
    endTime: '22:30',
    status: 'upcoming',
    staff: [
      { id: 's6', name: 'Phan Khánh Vy', avatar: 'https://i.pravatar.cc/150?u=s6', role: 'Waiter' },
      { id: 's7', name: 'Đặng Thiên Phú', avatar: 'https://i.pravatar.cc/150?u=s7', role: 'Chef' },
    ],
    leader: { id: 's7', name: 'Đặng Thiên Phú', avatar: 'https://i.pravatar.cc/150?u=s7' },
  },
];
