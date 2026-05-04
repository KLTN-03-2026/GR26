import { useMemo, useState } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Clock3 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/utils/cn';

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  align?: 'start' | 'center' | 'end';
}

const buildNumberOptions = (total: number): string[] => {
  return Array.from({ length: total }, (_, index) => String(index).padStart(2, '0'));
};

const HOUR_OPTIONS = buildNumberOptions(24);
const MINUTE_OPTIONS = buildNumberOptions(60);

/**
 * Parse chuỗi ngày giờ từ form về `Date` để bind với calendar/time selectors.
 */
const parseDateTimeValue = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
};

/**
 * Gộp ngày đã chọn với giờ/phút hiện tại để giữ nguyên thời điểm mà user đang chỉnh.
 */
const mergeDateAndTime = (baseDate: Date, nextDate: Date): Date => {
  const withHours = setHours(nextDate, baseDate.getHours());
  return setMinutes(withHours, baseDate.getMinutes());
};

/**
 * Date time picker dùng chung theo pattern shadcn `Button + Popover + Calendar + Select`.
 * Trả về ISO string để service layer có thể gửi backend trực tiếp.
 */
export const DateTimePicker = ({
  value,
  onChange,
  placeholder = 'Chọn ngày giờ',
  disabled = false,
  className,
  id,
  align = 'start',
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);

  const selectedDateTime = useMemo(() => parseDateTimeValue(value), [value]);
  const [draftDateTime, setDraftDateTime] = useState<Date | undefined>(selectedDateTime);
  const displayValue = selectedDateTime
    ? format(selectedDateTime, 'dd/MM/yyyy HH:mm', { locale: vi })
    : placeholder;

  /**
   * Khi mở hoặc đóng popover, luôn đồng bộ draft về giá trị hiện tại của form
   * để nút `Hủy` có thể bỏ toàn bộ thay đổi tạm chưa xác nhận.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    setDraftDateTime(selectedDateTime);
    setOpen(nextOpen);
  };

  const handleDateSelect = (nextDate?: Date) => {
    if (!nextDate) {
      setDraftDateTime(undefined);
      return;
    }

    const baseDate = draftDateTime ?? selectedDateTime ?? new Date();
    const mergedDateTime = mergeDateAndTime(baseDate, nextDate);

    setDraftDateTime(mergedDateTime);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', rawValue: string) => {
    const baseDate = draftDateTime ?? selectedDateTime ?? new Date();
    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) {
      return;
    }

    const nextDateTime =
      type === 'hours' ? setHours(baseDate, nextValue) : setMinutes(baseDate, nextValue);

    setDraftDateTime(nextDateTime);
  };

  const handleCancel = () => {
    setDraftDateTime(selectedDateTime);
    setOpen(false);
  };

  const handleConfirm = () => {
    onChange(draftDateTime ? draftDateTime.toISOString() : '');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn(
            'justify-start gap-2 px-3 font-normal text-left',
            !selectedDateTime && 'text-text-secondary',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-fit max-w-[220px] overflow-hidden rounded-xl p-0" align={align}>
        <div className="border-b border-border bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 p-3">
          <div className="mb-3">
            <p className="text-sm font-semibold text-text-primary">Chọn hạn sử dụng</p>
            <p className="text-xs text-text-secondary text-wrap">
              Chọn ngày, giờ và phút trước khi xác nhận.
            </p>
          </div>

          <div className="rounded-xl  border-border/70 bg-white/80 ">
            <div className="flex flex-wrap  justify-start gap-2">
              <div className="space-y-1.5">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  <Clock3 className="h-3.5 w-3.5" />
                  Giờ
                </p>
                <Select
                  value={draftDateTime ? format(draftDateTime, 'HH') : ''}
                  disabled={!draftDateTime}
                  onValueChange={(nextHours) => handleTimeChange('hours', nextHours)}
                >
                  <SelectTrigger className="h-9 w-[80px] rounded-lg">
                    <SelectValue placeholder="giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  <Clock3 className="h-3.5 w-3.5" />
                  Phút
                </p>
                <Select
                  value={draftDateTime ? format(draftDateTime, 'mm') : ''}
                  disabled={!draftDateTime}
                  onValueChange={(nextMinutes) => handleTimeChange('minutes', nextMinutes)}
                >
                  <SelectTrigger className="h-9 w-fit md:w-[80px] rounded-lg">
                    <SelectValue placeholder="phút" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTE_OPTIONS.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={draftDateTime}
          defaultMonth={draftDateTime ?? selectedDateTime}
          captionLayout="dropdown"
          locale={vi}
          onSelect={handleDateSelect}
        />

        <div className="flex justify-end gap-2 border-t border-border bg-slate-50/70 p-3">
          <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm}>
            Xong
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
