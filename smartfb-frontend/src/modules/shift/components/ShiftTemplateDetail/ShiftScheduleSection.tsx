import { CalendarDays } from 'lucide-react';
import type { ShiftSchedule } from '@modules/shift/types/shift.types';

interface ShiftScheduleSectionProps {
    schedules: ShiftSchedule[];
    isLoading?: boolean;
}

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getStatusBadgeClassName = (status: string) => {
    switch (status) {
        case 'CHECKED_IN':
            return 'badge-warning';
        case 'COMPLETED':
            return 'badge-completed';
        case 'REGISTERED':
            return 'badge-info';
        default:
            return 'badge-secondary';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'CHECKED_IN':
            return 'Đang làm';
        case 'COMPLETED':
            return 'Đã hoàn thành';
        case 'REGISTERED':
            return 'Đã đăng ký';
        default:
            return status;
    }
};

/**
 * Section hiển thị danh sách lịch ca của ca mẫu này
 */
export const ShiftScheduleSection = ({ schedules, isLoading = false }: ShiftScheduleSectionProps) => {
    if (isLoading) {
        return (
            <div className="card space-y-4">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-text-secondary" />
                    <h3 className="text-lg font-semibold text-text-primary">Lịch ca sắp tới</h3>
                </div>
                <div className="flex justify-center py-8">
                    <div className="spinner spinner-sm" />
                </div>
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <div className="card space-y-4">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-text-secondary" />
                    <h3 className="text-lg font-semibold text-text-primary">Lịch ca sắp tới</h3>
                </div>
                <p className="text-center text-text-secondary py-8">
                    Chưa có lịch ca nào được đăng ký cho ca mẫu này
                </p>
            </div>
        );
    }

    return (
        <div className="card space-y-4">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-text-secondary" />
                <h3 className="text-lg font-semibold text-text-primary">Lịch ca sắp tới</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-text-secondary">Ngày</th>
                            <th className="px-4 py-2 text-left text-text-secondary">Nhân viên</th>
                            <th className="px-4 py-2 text-left text-text-secondary">Check-in</th>
                            <th className="px-4 py-2 text-left text-text-secondary">Check-out</th>
                            <th className="px-4 py-2 text-left text-text-secondary">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map((schedule) => (
                            <tr key={schedule.id} className="border-b border-gray-100">
                                <td className="px-4 py-3 text-text-primary">{formatDate(schedule.date)}</td>
                                <td className="px-4 py-3 text-text-primary">{schedule.userId}</td>
                                <td className="px-4 py-3 text-text-secondary">
                                    {schedule.checkedInAt
                                        ? new Date(schedule.checkedInAt).toLocaleTimeString('vi-VN')
                                        : '--:--'}
                                </td>
                                <td className="px-4 py-3 text-text-secondary">
                                    {schedule.checkedOutAt
                                        ? new Date(schedule.checkedOutAt).toLocaleTimeString('vi-VN')
                                        : '--:--'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge ${getStatusBadgeClassName(schedule.status)}`}>
                                        {getStatusLabel(schedule.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};