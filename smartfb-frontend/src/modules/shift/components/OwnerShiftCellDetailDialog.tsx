import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import type { StaffSummary } from '@modules/staff/types/staff.types';
import type { LocalTime, ShiftSchedule, ShiftTemplate } from '@modules/shift/types/shift.types';
import { cn } from '@shared/utils/cn';

interface OwnerShiftCellDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  template: ShiftTemplate;
  schedules: ShiftSchedule[];
  staffMap: Map<string, StaffSummary>;
}

const formatLocalTime = (time?: LocalTime | null): string => {
  if (typeof time?.hour !== 'number' || typeof time?.minute !== 'number') {
    return '--:--';
  }

  return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
};

const getShiftStatusLabel = (status: ShiftSchedule['status']) => {
  switch (status) {
    case 'CHECKED_IN':
      return 'Đang làm';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'ABSENT':
      return 'Vắng';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return 'Đã xếp';
  }
};

const getShiftStatusClassName = (status: ShiftSchedule['status']) => {
  switch (status) {
    case 'CHECKED_IN':
      return 'badge-warning';
    case 'COMPLETED':
      return 'badge-completed';
    case 'ABSENT':
    case 'CANCELLED':
      return 'badge-secondary';
    default:
      return 'badge-info';
  }
};

/**
 * Dialog chi tiết một ô lịch, dùng khi ca có nhiều nhân viên để tránh làm roster bị phình.
 */
export const OwnerShiftCellDetailDialog = ({
  open,
  onOpenChange,
  dateLabel,
  template,
  schedules,
  staffMap,
}: OwnerShiftCellDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template.name} · {dateLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-card border border-border bg-cream/70 p-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">
              {formatLocalTime(template.startTime)} - {formatLocalTime(template.endTime)}
            </span>
            {' · '}
            {schedules.length}/{template.minStaff}-{template.maxStaff} nhân viên
          </div>

          {schedules.length === 0 ? (
            <div className="rounded-card border border-dashed border-border p-8 text-center text-sm text-text-secondary">
              Chưa có nhân viên nào được gán vào ca này.
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream/70 text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nhân viên</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium">Check-in</th>
                    <th className="px-4 py-3 text-left font-medium">Check-out</th>
                    <th className="px-4 py-3 text-left font-medium">Tăng ca</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => {
                    const staff = staffMap.get(schedule.userId);

                    return (
                      <tr key={schedule.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-primary">
                            {staff?.fullName ?? 'Chưa rõ nhân viên'}
                          </div>
                          {/* {staff?.employeeCode && (
                            <div className="text-xs text-text-secondary">{staff.employeeCode}</div>
                          )} */}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('badge', getShiftStatusClassName(schedule.status))}>
                            {getShiftStatusLabel(schedule.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatLocalTime(schedule.actualStartTime)}</td>
                        <td className="px-4 py-3">{formatLocalTime(schedule.actualEndTime)}</td>
                        <td
                          className={cn(
                            'px-4 py-3',
                            schedule.overtimeMinutes > 0 && 'text-success-text',
                            schedule.overtimeMinutes < 0 && 'text-warning-text',
                          )}
                        >
                          {schedule.overtimeMinutes} phút
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
