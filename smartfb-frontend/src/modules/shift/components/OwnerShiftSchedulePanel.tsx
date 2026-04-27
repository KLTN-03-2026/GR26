import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useShiftSchedules } from '@modules/shift/hooks/useShiftSchedules';
import { useStaffList } from '@modules/staff/hooks/useStaffList';
import type { ShiftSchedule, ShiftTemplate } from '@modules/shift/types/shift.types';
import { OwnerWeeklyShiftRoster } from '@modules/shift/components/OwnerWeeklyShiftRoster';
import { RegisterShiftDialog } from '@modules/shift/components/RegisterShiftDialog';

interface OwnerShiftSchedulePanelProps {
  templates: ShiftTemplate[];
  isTemplatesLoading: boolean;
}

interface RegisterDialogDefaults {
  date: string;
  shiftTemplateId?: string;
}

const getCurrentWeekStart = () => startOfWeek(new Date(), { weekStartsOn: 1 });

const formatDateLabel = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString('vi-VN');
};

const sortSchedules = (schedules: ShiftSchedule[]) => {
  return [...schedules].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.shiftTemplateId.localeCompare(right.shiftTemplateId);
  });
};

/**
 * Khu vực owner xem lịch ca toàn chi nhánh và gán nhân viên vào ca mẫu.
 */
export const OwnerShiftSchedulePanel = ({
  templates,
  isTemplatesLoading,
}: OwnerShiftSchedulePanelProps) => {
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStart);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [registerDefaults, setRegisterDefaults] = useState<RegisterDialogDefaults>({
    date: format(getCurrentWeekStart(), 'yyyy-MM-dd'),
  });

  const startDate = format(weekStartDate, 'yyyy-MM-dd');
  const endDate = format(addDays(weekStartDate, 6), 'yyyy-MM-dd');

  const { useBranchSchedule, registerShift, isRegistering } = useShiftSchedules();
  const scheduleQuery = useBranchSchedule(startDate, endDate);
  const staffQuery = useStaffList({ page: 0, size: 100, status: 'ACTIVE' });

  const staffList = useMemo(() => staffQuery.data?.content ?? [], [staffQuery.data?.content]);
  const schedules = useMemo(() => sortSchedules(scheduleQuery.data ?? []), [scheduleQuery.data]);

  const isLoading = scheduleQuery.isLoading || staffQuery.isLoading || isTemplatesLoading;
  const isError = scheduleQuery.isError || staffQuery.isError;
  const checkedInCount = schedules.filter((schedule) => schedule.status === 'CHECKED_IN').length;
  const completedCount = schedules.filter((schedule) => schedule.status === 'COMPLETED').length;

  const openRegisterDialog = (date = startDate, shiftTemplateId?: string) => {
    setRegisterDefaults({ date, shiftTemplateId });
    setIsRegisterDialogOpen(true);
  };

  const handlePreviousWeek = () => {
    setWeekStartDate((prev) => addDays(prev, -7));
  };

  const handleCurrentWeek = () => {
    setWeekStartDate(getCurrentWeekStart());
  };

  const handleNextWeek = () => {
    setWeekStartDate((prev) => addDays(prev, 7));
  };

  const handleRefresh = () => {
    void scheduleQuery.refetch();
    void staffQuery.refetch();
  };

  return (
    <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Lịch ca theo tuần</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Xem nhanh ca nào thiếu người, đủ người và gán nhân viên trực tiếp vào từng ô lịch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button type="button" onClick={() => openRegisterDialog()}>Gán ca</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-cream/70 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Tuần {formatDateLabel(startDate)} - {formatDateLabel(endDate)}
          </p>
          <p className="text-xs text-text-secondary">
            <span className="font-medium text-text-primary">{schedules.length}</span> ca ·{' '}
            <span className="font-medium text-warning-text">{checkedInCount}</span> đang làm ·{' '}
            <span className="font-medium text-success-text">{completedCount}</span> hoàn thành
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handlePreviousWeek}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Tuần trước
          </Button>
          <Button type="button" variant="outline" onClick={handleCurrentWeek}>
            Tuần này
          </Button>
          <Button type="button" variant="outline" onClick={handleNextWeek}>
            Tuần sau
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Không thể tải lịch ca. Vui lòng kiểm tra quyền truy cập hoặc thử lại.
        </div>
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="spinner spinner-md" />
        </div>
      ) : (
        <OwnerWeeklyShiftRoster
          weekStartDate={weekStartDate}
          templates={templates}
          schedules={schedules}
          staffList={staffList}
          onAssignShift={openRegisterDialog}
        />
      )}

      {isRegisterDialogOpen && (
        <RegisterShiftDialog
          open={isRegisterDialogOpen}
          onOpenChange={setIsRegisterDialogOpen}
          templates={templates}
          staffList={staffList}
          defaultDate={registerDefaults.date}
          defaultShiftTemplateId={registerDefaults.shiftTemplateId}
          isPending={isRegistering}
          onSubmit={registerShift}
        />
      )}
    </div>
  );
};
