import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { cn } from '@shared/utils/cn';

export interface DateRangePickerValue {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value?: DateRangePickerValue;
  onChange: (value: DateRangePickerValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Parse chuỗi `YYYY-MM-DD` sang `Date` để bind với `react-day-picker`.
 */
const parseDateValue = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
};

/**
 * Chuẩn hóa `Date` về format `YYYY-MM-DD` để các màn filter tái sử dụng trực tiếp.
 */
const formatDateValue = (value?: Date): string | undefined => {
  if (!value) {
    return undefined;
  }

  return format(value, 'yyyy-MM-dd');
};

/**
 * Dùng chung cho các bộ lọc chọn khoảng ngày theo pattern `Button + Popover + Calendar`.
 * Giá trị trả ra vẫn là chuỗi ngày để giữ nguyên contract với hook/service hiện có.
 */
export const DateRangePicker = ({
  value,
  onChange,
  placeholder = 'Chọn khoảng ngày',
  disabled = false,
  className,
  id,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = parseDateValue(value?.from);
    const to = parseDateValue(value?.to);

    if (!from && !to) {
      return undefined;
    }

    return { from, to };
  }, [value?.from, value?.to]);

  const displayValue = useMemo(() => {
    if (selectedRange?.from && selectedRange?.to) {
      return `${format(selectedRange.from, 'dd/MM/yyyy', { locale: vi })} - ${format(
        selectedRange.to,
        'dd/MM/yyyy',
        { locale: vi },
      )}`;
    }

    if (selectedRange?.from) {
      return format(selectedRange.from, 'dd/MM/yyyy', { locale: vi });
    }

    if (selectedRange?.to) {
      return format(selectedRange.to, 'dd/MM/yyyy', { locale: vi });
    }

    return placeholder;
  }, [placeholder, selectedRange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn(
            'justify-start gap-2 px-3 font-normal text-left',
            !selectedRange && 'text-text-secondary',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={selectedRange?.from ?? selectedRange?.to}
          selected={selectedRange}
          numberOfMonths={2}
          locale={vi}
          onSelect={(nextRange) => {
            onChange({
              from: formatDateValue(nextRange?.from),
              to: formatDateValue(nextRange?.to),
            });

            if (nextRange?.from && nextRange?.to) {
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
