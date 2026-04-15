import type { ShiftSchedule, LocalTime } from '../types/shift.types';

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
 * Lấy ngày hôm nay và các ngày trong tuần
 */
const today = new Date();
const getDateString = (daysOffset: number): string => {
    const date = new Date(today);
    date.setDate(today.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
};

/**
 * Mock data cho lịch ca (shift schedules)
 */
export const mockShiftSchedules: ShiftSchedule[] = [
    // Hôm nay
    {
        id: 'schedule-1',
        userId: 'user-1',
        shiftTemplateId: 'template-1',
        branchId: 'branch-1',
        date: getDateString(0),
        status: 'CHECKED_IN',
        checkedInAt: new Date().toISOString(),
        checkedOutAt: null,
        actualStartTime: createLocalTime(6, 5),
        actualEndTime: null,
        overtimeMinutes: 0,
        note: null,
    },
    {
        id: 'schedule-2',
        userId: 'user-2',
        shiftTemplateId: 'template-2',
        branchId: 'branch-1',
        date: getDateString(0),
        status: 'REGISTERED',
        checkedInAt: null,
        checkedOutAt: null,
        actualStartTime: null,
        actualEndTime: null,
        overtimeMinutes: 0,
        note: null,
    },
    // Ngày mai
    {
        id: 'schedule-3',
        userId: 'user-1',
        shiftTemplateId: 'template-2',
        branchId: 'branch-1',
        date: getDateString(1),
        status: 'REGISTERED',
        checkedInAt: null,
        checkedOutAt: null,
        actualStartTime: null,
        actualEndTime: null,
        overtimeMinutes: 0,
        note: null,
    },
    {
        id: 'schedule-4',
        userId: 'user-3',
        shiftTemplateId: 'template-3',
        branchId: 'branch-1',
        date: getDateString(1),
        status: 'REGISTERED',
        checkedInAt: null,
        checkedOutAt: null,
        actualStartTime: null,
        actualEndTime: null,
        overtimeMinutes: 0,
        note: null,
    },
    // Hôm qua (đã hoàn thành)
    {
        id: 'schedule-5',
        userId: 'user-1',
        shiftTemplateId: 'template-1',
        branchId: 'branch-1',
        date: getDateString(-1),
        status: 'COMPLETED',
        checkedInAt: new Date(Date.now() - 86400000).toISOString(),
        checkedOutAt: new Date(Date.now() - 86400000 + 5 * 3600000).toISOString(),
        actualStartTime: createLocalTime(6, 0),
        actualEndTime: createLocalTime(11, 0),
        overtimeMinutes: 0,
        note: null,
    },
];

/**
 * Lấy lịch ca theo ID
 */
export const getMockShiftScheduleById = (id: string): ShiftSchedule | undefined => {
    return mockShiftSchedules.find(schedule => schedule.id === id);
};

/**
 * Lấy lịch ca theo branch và khoảng ngày
 */
export const getMockShiftSchedulesByBranchAndDateRange = (
    branchId: string,
    startDate: string,
    endDate: string
): ShiftSchedule[] => {
    return mockShiftSchedules.filter(
        schedule =>
            schedule.branchId === branchId &&
            schedule.date >= startDate &&
            schedule.date <= endDate
    );
};