import type { ShiftTemplate, LocalTime } from '../types/shift.types';

/**
 * Helper để tạo LocalTime
 */
const createLocalTime = (hour: number, minute: number = 0): LocalTime => ({
    hour,
    minute,
    second: 0,
    nano: 0,
});

/**
 * Mock data cho danh sách ca mẫu
 */
export const mockShiftTemplates: ShiftTemplate[] = [
    {
        id: 'template-1',
        branchId: 'branch-1',
        name: 'Ca sáng',
        startTime: createLocalTime(6, 0),
        endTime: createLocalTime(11, 0),
        minStaff: 2,
        maxStaff: 5,
        color: '#FFE4B5',
        active: true,
        durationMinutes: 300,
    },
    {
        id: 'template-2',
        branchId: 'branch-1',
        name: 'Ca trưa',
        startTime: createLocalTime(11, 0),
        endTime: createLocalTime(14, 0),
        minStaff: 3,
        maxStaff: 8,
        color: '#FFD700',
        active: true,
        durationMinutes: 180,
    },
    {
        id: 'template-3',
        branchId: 'branch-1',
        name: 'Ca chiều',
        startTime: createLocalTime(14, 0),
        endTime: createLocalTime(17, 0),
        minStaff: 2,
        maxStaff: 6,
        color: '#98FB98',
        active: true,
        durationMinutes: 180,
    },
    {
        id: 'template-4',
        branchId: 'branch-1',
        name: 'Ca tối',
        startTime: createLocalTime(17, 0),
        endTime: createLocalTime(22, 0),
        minStaff: 4,
        maxStaff: 10,
        color: '#87CEEB',
        active: true,
        durationMinutes: 300,
    },
    {
        id: 'template-5',
        branchId: 'branch-1',
        name: 'Ca đêm',
        startTime: createLocalTime(22, 0),
        endTime: createLocalTime(2, 0),
        minStaff: 2,
        maxStaff: 4,
        color: '#DDA0DD',
        active: false,
        durationMinutes: 240,
    },
];

/**
 * Lấy ca mẫu theo ID
 */
export const getMockShiftTemplateById = (id: string): ShiftTemplate | undefined => {
    return mockShiftTemplates.find(template => template.id === id);
};