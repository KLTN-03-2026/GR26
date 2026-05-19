import { useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertTriangle, Plus } from 'lucide-react';
import type { StaffSummary } from '@modules/staff/types/staff.types';
import type { LocalTime, ShiftSchedule, ShiftTemplate } from '@modules/shift/types/shift.types';
import { OwnerShiftCellDetailDialog } from '@modules/shift/components/OwnerShiftCellDetailDialog';
import { RegisterShiftDialog } from '@modules/shift/components/RegisterShiftDialog';
import { isPastShiftDate } from '@modules/shift/utils/shiftDateGuard';
import { useToast } from '@shared/hooks/useToast';
import { cn } from '@shared/utils/cn';

interface OwnerWeeklyShiftRosterProps {
  weekStartDate: Date;
  templates: ShiftTemplate[];
  schedules: ShiftSchedule[];
  staffList: StaffSummary[];
  today: string;
  onAssignShift: (date: string, shiftTemplateId: string) => void;
  onUpdateShift: (scheduleId: string, payload: { userId: string; shiftTemplateId: string; date: string }) => Promise<unknown>;
  onDeleteShift: (scheduleId: string, scheduleDate: string) => Promise<unknown>;
  isUpdating: boolean;
  isDeleting: boolean;
}

const formatLocalTime = (time?: LocalTime | null): string => {
  if (typeof time?.hour !== 'number' || typeof time?.minute !== 'number') {
    return '--:--';
  }

  return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
};

const buildStaffMap = (staffList: StaffSummary[]) => {
  return new Map(staffList.map((staff) => [staff.id, staff]));
};

const buildScheduleMap = (schedules: ShiftSchedule[]) => {
  const scheduleMap = new Map<string, ShiftSchedule[]>();

  schedules.forEach((schedule) => {
    const key = `${schedule.date}:${schedule.shiftTemplateId}`;
    const currentSchedules = scheduleMap.get(key) ?? [];
    scheduleMap.set(key, [...currentSchedules, schedule]);
  });

  return scheduleMap;
};

const getCellStatus = (count: number, template: ShiftTemplate) => {
  if (count === 0) {
    return {
      label: 'Chưa gán',
      className: 'border-dashed border-border bg-white',
      isWarning: true,
    };
  }

  if (count < template.minStaff) {
    return {
      label: `Thiếu ${template.minStaff - count}`,
      className: 'border-amber-200 bg-amber-50',
      isWarning: true,
    };
  }

  if (count > template.maxStaff) {
    return {
      label: `Dư ${count - template.maxStaff}`,
      className: 'border-red-200 bg-red-50',
      isWarning: true,
    };
  }

  return {
    label: 'Đủ người',
    className: 'border-emerald-200 bg-emerald-50',
    isWarning: false,
  };
};

const getShiftChipClassName = (status: ShiftSchedule['status']) => {
  switch (status) {
    case 'CHECKED_IN':
      return 'border-amber-200 bg-amber-100 text-amber-900';
    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-100 text-emerald-900';
    case 'ABSENT':
    case 'CANCELLED':
      return 'border-gray-200 bg-gray-100 text-gray-600';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-900';
  }
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

interface SelectedCell {
  dateValue: string;
  dateLabel: string;
  template: ShiftTemplate;
  schedules: ShiftSchedule[];
}

/**
 * Roster tuần giúp owner nhìn nhanh ca nào thiếu/dư người và gán ca trực tiếp từ ô lịch.
 */
export const OwnerWeeklyShiftRoster = ({
  weekStartDate,
  templates,
  schedules,
  staffList,
  today,
  onAssignShift,
  onUpdateShift,
  onDeleteShift,
  isUpdating,
  isDeleting,
}: OwnerWeeklyShiftRosterProps) => {
  const { error } = useToast();
  const normalizedWeekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(normalizedWeekStart, index);

    return {
      date,
      value: format(date, 'yyyy-MM-dd'),
      dayLabel: format(date, 'EEEE', { locale: vi }),
      dateLabel: format(date, 'dd/MM', { locale: vi }),
    };
  });

  const activeTemplates = templates.filter((template) => template.active);
  const staffMap = buildStaffMap(staffList);
  const scheduleMap = buildScheduleMap(schedules);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ShiftSchedule | null>(null);

  const handleEditSchedule = (schedule: ShiftSchedule) => {
    if (isPastShiftDate(schedule.date, today)) {
      error('Không thể sửa lịch đã qua ngày', 'Bạn chỉ được xem lịch làm của các ngày trong quá khứ.');
      return;
    }

    setSelectedCell(null);
    setEditingSchedule(schedule);
  };

  const handleDeleteSchedule = async (schedule: ShiftSchedule) => {
    if (isPastShiftDate(schedule.date, today)) {
      error('Không thể xóa lịch đã qua ngày', 'Bạn chỉ được xem lịch làm của các ngày trong quá khứ.');
      return;
    }

    await onDeleteShift(schedule.id, schedule.date);
    setSelectedCell(null);
  };

  if (activeTemplates.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-8 text-center">
        <p className="font-medium text-text-primary">Chưa có ca mẫu đang hoạt động</p>
        <p className="mt-1 text-sm text-text-secondary">Tạo ca mẫu trước khi xếp lịch tuần cho nhân viên.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-white">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[190px_repeat(7,minmax(112px,1fr))] border-b border-border bg-cream/70">
          <div className="border-r border-border p-3 text-sm font-semibold text-text-primary">Ca làm</div>
          {weekDays.map((day) => (
            <div key={day.value} className="border-r border-border p-3 last:border-r-0">
              <div className="text-sm font-semibold capitalize text-text-primary">{day.dayLabel}</div>
              <div className="text-xs text-text-secondary">{day.dateLabel}</div>
            </div>
          ))}
        </div>

        {activeTemplates.map((template) => (
          <div
            key={template.id}
            className="grid grid-cols-[190px_repeat(7,minmax(112px,1fr))] border-b border-border last:border-b-0"
          >
            <div className="border-r border-border p-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: template.color }}
                />
                <p className="font-semibold text-text-primary">{template.name}</p>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {formatLocalTime(template.startTime)} - {formatLocalTime(template.endTime)}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Cần {template.minStaff}-{template.maxStaff} nhân viên
              </p>
            </div>

            {weekDays.map((day) => {
              const cellSchedules = scheduleMap.get(`${day.value}:${template.id}`) ?? [];
              const cellStatus = getCellStatus(cellSchedules.length, template);
              const isPastDay = isPastShiftDate(day.value, today);

              return (
                <div
                  key={`${template.id}-${day.value}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCell({
                    dateValue: day.value,
                    dateLabel: `${day.dayLabel} ${day.dateLabel}`,
                    template,
                    schedules: cellSchedules,
                  })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCell({
                        dateValue: day.value,
                        dateLabel: `${day.dayLabel} ${day.dateLabel}`,
                        template,
                        schedules: cellSchedules,
                      });
                    }
                  }}
                  className={cn(
                    'min-h-36 cursor-pointer border-r border-border p-2 text-left transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 last:border-r-0',
                    cellStatus.className,
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-primary">
                      {cellSchedules.length}/{template.minStaff}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        cellStatus.isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800',
                      )}
                    >
                      {cellStatus.isWarning && <AlertTriangle className="h-3 w-3" />}
                      {cellStatus.label}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {cellSchedules.slice(0, 4).map((schedule) => {
                      const staff = staffMap.get(schedule.userId);
                      const staffLabel = staff?.fullName ?? 'Chưa rõ nhân viên';

                      return (
                        <div
                          key={schedule.id}
                          className={cn(
                            'rounded-lg border px-2 py-1.5 text-xs',
                            getShiftChipClassName(schedule.status),
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate font-semibold">{staffLabel}</span>
                            <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium">
                              {getShiftStatusLabel(schedule.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {cellSchedules.length > 4 && (
                      <div className="text-xs font-medium text-text-secondary">
                        +{cellSchedules.length - 4} nhân viên khác
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (isPastDay) {
                          return;
                        }

                        if (cellSchedules.length === 0) {
                          onAssignShift(day.value, template.id);
                          return;
                        }

                        setSelectedCell({
                          dateValue: day.value,
                          dateLabel: `${day.dayLabel} ${day.dateLabel}`,
                          template,
                          schedules: cellSchedules,
                        });
                      }}
                      disabled={isPastDay}
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700',
                        isPastDay && 'cursor-not-allowed text-text-secondary hover:text-text-secondary',
                      )}
                    >
                      {cellSchedules.length === 0 ? (
                        <>
                          <Plus className="h-3 w-3" />
                          Gán nhân viên
                        </>
                      ) : (
                        // <>
                        //   <Users className="h-3 w-3" />
                        //   Xem chi tiết
                        // </>
                        <></>
                      )}
                    </button>

                    {cellSchedules.length > 0 && !isPastDay && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAssignShift(day.value, template.id);
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                      >
                        <Plus className="h-3 w-3" />
                        Gán thêm
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedCell && (
        <OwnerShiftCellDetailDialog
          open={Boolean(selectedCell)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCell(null);
            }
          }}
          dateLabel={selectedCell.dateLabel}
          template={selectedCell.template}
          schedules={selectedCell.schedules}
          staffMap={staffMap}
          isPastDate={isPastShiftDate(selectedCell.dateValue, today)}
          onEditSchedule={handleEditSchedule}
          onDeleteSchedule={(schedule) => void handleDeleteSchedule(schedule)}
          isDeleting={isDeleting}
        />
      )}

      {editingSchedule && (
        <RegisterShiftDialog
          key={editingSchedule.id}
          open={Boolean(editingSchedule)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingSchedule(null);
            }
          }}
          templates={templates}
          staffList={staffList}
          defaultDate={editingSchedule.date}
          defaultShiftTemplateId={editingSchedule.shiftTemplateId}
          defaultUserId={editingSchedule.userId}
          isPending={isUpdating}
          title="Sửa lịch ca"
          submitLabel="Lưu thay đổi"
          pendingLabel="Đang lưu..."
          onSubmit={async (payload) => {
            if (isPastShiftDate(payload.date, today)) {
              error('Không thể sửa lịch đã qua ngày', 'Bạn chỉ được xem lịch làm của các ngày trong quá khứ.');
              return;
            }

            await onUpdateShift(editingSchedule.id, payload);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
};
