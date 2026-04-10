/**
 * Mock data ca làm việc cho trang Branch Detail
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

export const shiftScheduleMock: Shift[] = [
  {
    id: 'shift-1',
    name: 'Ca Sáng',
    startTime: '07:00',
    endTime: '12:00',
    status: 'ongoing',
    staff: [
      { id: 's1', name: 'Hoàng Anh', avatar: 'https://i.pravatar.cc/150?u=s1', role: 'Pha chế' },
      { id: 's2', name: 'Minh Thư', avatar: 'https://i.pravatar.cc/150?u=s2', role: 'Phục vụ' },
      { id: 's3', name: 'Tuấn Kiệt', avatar: 'https://i.pravatar.cc/150?u=s3', role: 'Bếp' },
      { id: 's4', name: 'Phương Linh', avatar: 'https://i.pravatar.cc/150?u=s4', role: 'Thu ngân' },
    ],
    leader: { id: 's1', name: 'Hoàng Anh', avatar: 'https://i.pravatar.cc/150?u=s1' },
  },
  {
    id: 'shift-2',
    name: 'Ca Chiều',
    startTime: '12:00',
    endTime: '17:00',
    status: 'upcoming',
    staff: [
      { id: 's5', name: 'Gia Huy', avatar: 'https://i.pravatar.cc/150?u=s5', role: 'Pha chế' },
      { id: 's6', name: 'Khánh Vy', avatar: 'https://i.pravatar.cc/150?u=s6', role: 'Phục vụ' },
    ],
    leader: { id: 's5', name: 'Gia Huy', avatar: 'https://i.pravatar.cc/150?u=s5' },
  },
  {
    id: 'shift-3',
    name: 'Ca Tối',
    startTime: '17:00',
    endTime: '22:30',
    status: 'upcoming',
    staff: [
      { id: 's7', name: 'Thiên Phú', avatar: 'https://i.pravatar.cc/150?u=s7', role: 'Pha chế' },
      { id: 's8', name: 'Hồng Nhung', avatar: 'https://i.pravatar.cc/150?u=s8', role: 'Phục vụ' },
      { id: 's9', name: 'Đức Minh', avatar: 'https://i.pravatar.cc/150?u=s9', role: 'Bếp' },
    ],
    leader: { id: 's7', name: 'Thiên Phú', avatar: 'https://i.pravatar.cc/150?u=s7' },
  },
];
