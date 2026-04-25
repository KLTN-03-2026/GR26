import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { cn } from '@shared/utils/cn';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  align?: 'start' | 'center' | 'end';
}

/**
 * Parse chuỗi `YYYY-MM-DD` sang `Date` để đồng bộ với `react-day-picker`.
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
 * Chuẩn hóa ngày về `YYYY-MM-DD` vì backend report nhận query param dạng ISO date.
 */
const formatDateValue = (value: Date): string => {
  return format(value, 'yyyy-MM-dd');
};

/**
 * Date picker dùng chung theo pattern shadcn `Button + Popover + Calendar`.
 * Component trả về chuỗi ngày để service report dùng trực tiếp cho query params.
 */
export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  disabled = false,
  className,
  id,
  align = 'start',
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const displayValue = selectedDate
    ? format(selectedDate, 'dd/MM/yyyy', { locale: vi })
    : placeholder;

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
            !selectedDate && 'text-text-secondary',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          locale={vi}
          onSelect={(nextDate) => {
            if (!nextDate) {
              return;
            }

            onChange(formatDateValue(nextDate));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
