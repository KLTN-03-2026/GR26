import { Clock, User, Crown } from 'lucide-react';
import type { Shift } from '@modules/staff/data/shiftScheduleMock';

interface ShiftScheduleSectionProps {
  shifts: Shift[];
  isLoading?: boolean;
}

/**
 * Section hiển thị lịch ca làm việc của nhân viên
 */
export const ShiftScheduleSection = ({ shifts, isLoading = false }: ShiftScheduleSectionProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ca làm việc</h3>
        <div className="flex justify-center py-8">
          <div className="spinner spinner-md" />
        </div>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ca làm việc</h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có ca làm việc nào</p>
        </div>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ongoing': return { text: 'Đang diễn ra', className: 'bg-green-100 text-green-700' };
      case 'upcoming': return { text: 'Sắp tới', className: 'bg-blue-100 text-blue-700' };
      default: return { text: 'Đã kết thúc', className: 'bg-gray-100 text-gray-500' };
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ca làm việc</h3>
      <div className="space-y-3">
        {shifts.map((shift) => {
          const statusInfo = getStatusDisplay(shift.status);
          return (
            <div key={shift.id} className="border rounded-xl p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{shift.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.className}`}>
                  {statusInfo.text}
                </span>
              </div>
              
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Crown className="w-3 h-3" />
                  <span>Trưởng ca: {shift.leader.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>{shift.staff.length} nhân viên</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
