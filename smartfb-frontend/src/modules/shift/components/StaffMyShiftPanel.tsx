import { useMemo, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  TimerReset,
} from 'lucide-react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useShiftSchedules } from '@modules/shift/hooks/useShiftSchedules';
import { useShiftTemplates } from '@modules/shift/hooks/useShiftTemplates';
import type { LocalTime, RegisterShiftPayload, ShiftSchedule, ShiftTemplate, ShiftStatus } from '@modules/shift/types/shift.types';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { formatDate, formatDateTime } from '@shared/utils/formatDate';
import { cn } from '@shared/utils/cn';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

interface StaffShiftCardProps {
  schedule: ShiftSchedule;
  template?: ShiftTemplate;
  today: string;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
  onCheckIn: (scheduleId: string) => void;
  onCheckOut: (scheduleId: string) => void;
}

/**
 * Nhãn trạng thái ca làm hiển thị cho staff theo status đã normalize từ backend.
 */
const STATUS_LABELS: Record<ShiftStatus, string> = {
  REGISTERED: 'Chờ check-in',
  CHECKED_IN: 'Đang làm',
  COMPLETED: 'Đã hoàn tất',
  ABSENT: 'Vắng mặt',
  CANCELLED: 'Đã hủy',
};

/**
 * Màu badge trạng thái giúp nhân viên nhận biết nhanh ca nào cần thao tác.
 */
const STATUS_CLASS_NAMES: Record<ShiftStatus, string> = {
  REGISTERED: 'border-warning-border bg-warning-light text-warning-text',
  CHECKED_IN: 'border-success-border bg-success-light text-success-text',
  COMPLETED: 'border-border bg-muted text-text-secondary',
  ABSENT: 'border-danger-border bg-danger-light text-danger-text',
  CANCELLED: 'border-border bg-muted text-text-secondary',
};

/**
 * Tông màu thẻ thống kê dùng chung cho các chỉ số ca làm cá nhân.
 */
const STAT_TONE_CLASS_NAMES: Record<StatCardProps['tone'], string> = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning-text',
  danger: 'bg-danger-light text-danger-text',
};

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (value: string, dayCount: number): string => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + dayCount);
  return toDateInputValue(date);
};

const getWeekRange = (baseDate = new Date()) => {
  const start = new Date(baseDate);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)),
  };
};

const formatLocalTime = (time?: LocalTime | null): string => {
  if (!time) return '--:--';
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
};

const buildTemplateMap = (templates: ShiftTemplate[]) => {
  return new Map(templates.map((template) => [template.id, template]));
};

const sortSchedules = (schedules: ShiftSchedule[]) => {
  return [...schedules].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    return left.shiftTemplateId.localeCompare(right.shiftTemplateId);
  });
};

const StatCard = ({ icon, label, value, tone }: StatCardProps) => (
  <div className="card">
    <div className="flex items-center gap-3">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-card', STAT_TONE_CLASS_NAMES[tone])}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  </div>
);

const StaffShiftCard = ({
  schedule,
  template,
  today,
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckOut,
}: StaffShiftCardProps) => {
  const canCheckIn = schedule.status === 'REGISTERED' && schedule.date === today;
  const canCheckOut = schedule.status === 'CHECKED_IN';
  const hasAction = canCheckIn || canCheckOut;
  const templateName = template?.name ?? 'Ca chưa rõ';
  const timeRange = template
    ? `${formatLocalTime(template.startTime)} - ${formatLocalTime(template.endTime)}`
    : 'Chưa có khung giờ';

  return (
    <article className="rounded-card border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">{templateName}</h3>
            <span className={cn('badge border', STATUS_CLASS_NAMES[schedule.status])}>
              {STATUS_LABELS[schedule.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatDate(schedule.date, 'EEEE, dd/MM/yyyy')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {timeRange}
            </span>
          </div>
          <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
            <span>Check-in: {schedule.checkedInAt ? formatDateTime(schedule.checkedInAt) : 'Chưa ghi nhận'}</span>
            <span>Check-out: {schedule.checkedOutAt ? formatDateTime(schedule.checkedOutAt) : 'Chưa ghi nhận'}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {canCheckIn && (
            <Button
              type="button"
              onClick={() => onCheckIn(schedule.id)}
              disabled={isCheckingIn}
              className="h-10"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Check-in
            </Button>
          )}
          {canCheckOut && (
            <Button
              type="button"
              onClick={() => onCheckOut(schedule.id)}
              disabled={isCheckingOut}
              className="h-10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Check-out
            </Button>
          )}
          {!hasAction && (
            <Button type="button" variant="outline" disabled className="h-10">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Không có thao tác
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export const StaffMyShiftPanel = () => {
  const today = toDateInputValue(new Date());
  const currentUser = useAuthStore((state) => state.user);
  const initialRange = useMemo(() => getWeekRange(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [registerDate, setRegisterDate] = useState(today);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const { templates, isLoading: isTemplatesLoading, error: templateError, refetch: refetchTemplates } = useShiftTemplates();
  const {
    useMySchedule,
    registerShift,
    checkIn,
    checkOut,
    isRegistering,
    isCheckingIn,
    isCheckingOut,
  } = useShiftSchedules();

  const scheduleQuery = useMySchedule(startDate, endDate);
  const activeTemplates = useMemo(() => templates.filter((template) => template.active), [templates]);
  const templateMap = useMemo(() => buildTemplateMap(templates), [templates]);
  const schedules = useMemo(() => sortSchedules(scheduleQuery.data ?? []), [scheduleQuery.data]);
  const todaySchedules = schedules.filter((schedule) => schedule.date === today);
  const activeShift = schedules.find((schedule) => schedule.status === 'CHECKED_IN');
  const upcomingCount = schedules.filter((schedule) => schedule.status === 'REGISTERED').length;
  const completedCount = schedules.filter((schedule) => schedule.status === 'COMPLETED').length;
  const isLoading = scheduleQuery.isLoading || isTemplatesLoading;
  const isError = scheduleQuery.isError || Boolean(templateError);
  const canRegister = Boolean(currentUser?.id && selectedTemplateId && registerDate);

  const shiftWeek = (dayCount: number) => {
    setStartDate((current) => addDays(current, dayCount));
    setEndDate((current) => addDays(current, dayCount));
  };

  const resetToCurrentWeek = () => {
    const nextRange = getWeekRange();
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
  };

  const refreshData = () => {
    void scheduleQuery.refetch();
    void refetchTemplates();
  };

  const handleRegister = async () => {
    if (!currentUser?.id || !selectedTemplateId || !registerDate) return;

    const payload: RegisterShiftPayload = {
      userId: currentUser.id,
      shiftTemplateId: selectedTemplateId,
      date: registerDate,
    };

    await registerShift(payload);
    setSelectedTemplateId('');
    void scheduleQuery.refetch();
  };

  if (!currentUser?.branchId) {
    return (
      <div className="card border-warning-border bg-warning-light text-warning-text">
        <p className="font-semibold">Chưa chọn chi nhánh làm việc</p>
        <p className="mt-1 text-sm">Bạn cần chọn chi nhánh trước khi xem hoặc đăng ký ca làm.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-danger-border bg-danger-light p-5 text-danger-text">
        <p className="font-semibold">Không thể tải dữ liệu ca làm</p>
        <p className="mt-1 text-sm">Vui lòng thử tải lại hoặc kiểm tra quyền truy cập lịch làm.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={refreshData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Ca trong kỳ"
          value={String(schedules.length).padStart(2, '0')}
          tone="primary"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Chờ check-in"
          value={String(upcomingCount).padStart(2, '0')}
          tone="warning"
        />
        <StatCard
          icon={<TimerReset className="h-5 w-5" />}
          label="Đang làm"
          value={activeShift ? '01' : '00'}
          tone="success"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Đã hoàn tất"
          value={String(completedCount).padStart(2, '0')}
          tone="primary"
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Lịch ca cá nhân</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => shiftWeek(-7)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Tuần trước
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={resetToCurrentWeek}>
                Tuần này
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => shiftWeek(7)}>
                Tuần sau
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tải lại
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-shift-start-date">Từ ngày</Label>
              <Input
                id="staff-shift-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-shift-end-date">Đến ngày</Label>
              <Input
                id="staff-shift-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {schedules.length === 0 ? (
              <div className="rounded-card border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                Chưa có ca làm trong khoảng ngày đã chọn.
              </div>
            ) : (
              schedules.map((schedule) => (
                <StaffShiftCard
                  key={schedule.id}
                  schedule={schedule}
                  template={templateMap.get(schedule.shiftTemplateId)}
                  today={today}
                  isCheckingIn={isCheckingIn}
                  isCheckingOut={isCheckingOut}
                  onCheckIn={(scheduleId) => void checkIn(scheduleId)}
                  onCheckOut={(scheduleId) => void checkOut(scheduleId)}
                />
              ))
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-text-primary">Đăng ký ca</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Chỉ đăng ký cho tài khoản của bạn tại chi nhánh đang làm việc.
            </p>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-register-date">Ngày làm việc</Label>
                <Input
                  id="staff-register-date"
                  type="date"
                  value={registerDate}
                  onChange={(event) => setRegisterDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ca mẫu</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ca muốn đăng ký" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} · {formatLocalTime(template.startTime)}-{formatLocalTime(template.endTime)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => void handleRegister()}
                disabled={!canRegister || isRegistering || activeTemplates.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Đăng ký ca
              </Button>
              {activeTemplates.length === 0 && (
                <p className="text-sm text-warning-text">Chi nhánh chưa có ca mẫu đang hoạt động.</p>
              )}
            </div>
          </div>

          <div className="rounded-card border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-text-primary">Ca hôm nay</h2>
            <div className="mt-3 space-y-2">
              {todaySchedules.length === 0 ? (
                <p className="text-sm text-text-secondary">Hôm nay bạn chưa có ca.</p>
              ) : (
                todaySchedules.map((schedule) => {
                  const template = templateMap.get(schedule.shiftTemplateId);
                  return (
                    <div key={schedule.id} className="rounded-card border border-border p-3">
                      <p className="font-medium text-text-primary">{template?.name ?? 'Ca chưa rõ'}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {template ? `${formatLocalTime(template.startTime)} - ${formatLocalTime(template.endTime)}` : 'Chưa có khung giờ'}
                      </p>
                      <span className={cn('badge mt-2 border', STATUS_CLASS_NAMES[schedule.status])}>
                        {STATUS_LABELS[schedule.status]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
