import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import type { StaffSummary } from '@modules/staff/types/staff.types';
import type { LocalTime, ShiftSchedule, ShiftTemplate } from '@modules/shift/types/shift.types';
import { cn } from '@shared/utils/cn';
import { Pencil, Trash2 } from 'lucide-react';

interface OwnerShiftCellDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  template: ShiftTemplate;
  schedules: ShiftSchedule[];
  staffMap: Map<string, StaffSummary>;
  isPastDate: boolean;
  onEditSchedule: (schedule: ShiftSchedule) => void;
  onDeleteSchedule: (schedule: ShiftSchedule) => void;
  isDeleting: boolean;
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
  isPastDate,
  onEditSchedule,
  onDeleteSchedule,
  isDeleting,
}: OwnerShiftCellDetailDialogProps) => {
  const [deleteCandidate, setDeleteCandidate] = useState<ShiftSchedule | null>(null);
  const deleteCandidateStaff = deleteCandidate ? staffMap.get(deleteCandidate.userId) : null;

  const handleConfirmDelete = () => {
    if (!deleteCandidate) {
      return;
    }

    onDeleteSchedule(deleteCandidate);
    setDeleteCandidate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{template.name} · {dateLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-card border border-border bg-cream/70 p-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">
              {formatLocalTime(template.startTime)} - {formatLocalTime(template.endTime)}
            </span>
            
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
                    <th className="px-4 py-3 sm:text-nowrap text-left font-medium">Nhân viên</th>
                    <th className="px-4 py-3 sm:text-nowrap text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 sm:text-nowrap text-left font-medium">Check-in</th>
                    <th className="px-4 py-3 sm:text-nowrap text-left font-medium">Check-out</th>
                    <th className="px-4 py-3 sm:text-nowrap text-left font-medium">Tăng ca</th>
                    <th className="px-4 py-3 sm:text-nowrap text-right font-medium">Thao tác</th>
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
                        
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('badge text-nowrap', getShiftStatusClassName(schedule.status))}>
                            {getShiftStatusLabel(schedule.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatLocalTime(schedule.actualStartTime)}</td>
                        <td className="px-4 py-3">{formatLocalTime(schedule.actualEndTime)}</td>
                        <td
                          className={cn(
                            'px-4 py-3 text-nowrap',
                            schedule.overtimeMinutes > 0 && 'text-success-text',
                            schedule.overtimeMinutes < 0 && 'text-warning-text',
                          )}
                        >
                          {schedule.overtimeMinutes} phút
                        </td>
                        <td className="px-4 py-3">
                          {schedule.status === 'REGISTERED' && !isPastDate ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onEditSchedule(schedule)}
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Sửa
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={isDeleting}
                                onClick={() => setDeleteCandidate(schedule)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Xóa
                              </Button>
                            </div>
                          ) : (
                            <span className="block text-right text-xs text-text-secondary sm:text-nowrap">
                              {isPastDate ? 'Chỉ xem' : 'Không khả dụng'}
                            </span>
                          )}
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

      <Dialog open={Boolean(deleteCandidate)} onOpenChange={(nextOpen) => !nextOpen && setDeleteCandidate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa lịch ca</DialogTitle>
            <DialogDescription className="leading-6">
              Bạn có chắc chắn muốn xóa lịch ca của{' '}
              <span className="font-semibold text-text-primary">
                {deleteCandidateStaff?.fullName ?? 'nhân viên này'}
              </span>{' '}
              không? Chỉ ca chưa check-in và chưa quá ngày mới có thể xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Đang xóa...' : 'Xóa lịch ca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
