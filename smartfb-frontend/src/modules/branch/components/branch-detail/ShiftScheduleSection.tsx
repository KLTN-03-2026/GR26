import { Sun, Moon, Coffee } from 'lucide-react';
import type { Shift, ShiftStaff } from '@modules/branch/data/shiftScheduleMock';

interface ShiftScheduleSectionProps {
  shifts: Shift[];
  isLoading?: boolean;
}

const statusConfig: Record<Shift['status'], { label: string; color: string; bgColor: string; borderColor: string }> = {
  ongoing: {
    label: 'ĐANG DIỄN RA',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
  },
  upcoming: {
    label: 'SẮP TỚI',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
  },
  ended: {
    label: 'KẾT THÚC',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

const getShiftIcon = (shift: Shift) => {
  const hour = parseInt(shift.startTime.split(':')[0]);
  if (hour < 12) return Sun;
  if (hour < 17) return Coffee;
  return Moon;
};

/**
 * Section hiển thị ca làm việc trong ngày
 */
export const ShiftScheduleSection = ({ shifts, isLoading = false }: ShiftScheduleSectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shifts.map((shift) => {
        const config = statusConfig[shift.status];
        const Icon = getShiftIcon(shift);

        return (
          <div
            key={shift.id}
            className={`bg-white rounded-2xl p-4 border-2 ${
              shift.status === 'ongoing' ? config.borderColor : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                  <p className="text-xs text-gray-500">{shift.startTime} - {shift.endTime}</p>
                </div>
              </div>
              {shift.status !== 'ended' && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
              )}
            </div>

            {/* Staff avatars */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {shift.staff.slice(0, 4).map((staff: ShiftStaff) => (
                  <div
                    key={staff.id}
                    className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                    title={staff.name}
                  >
                    {staff.avatar ? (
                      <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-300">
                        {staff.name.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {shift.staff.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{shift.staff.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {shift.staff.length} nhân sự
              </span>
            </div>

            {/* Shift leader */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Trưởng ca: <span className="font-medium text-gray-900">{shift.leader.name}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
