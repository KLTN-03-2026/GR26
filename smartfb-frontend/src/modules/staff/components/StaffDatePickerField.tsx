import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronDownIcon } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Label } from '@shared/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components/ui/popover';
import { cn } from '@shared/utils/cn';

interface StaffDatePickerFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
}

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
 * Ô chọn ngày dùng pattern shadcn `Button + Popover + Calendar`.
 * Giá trị gửi backend vẫn là `YYYY-MM-DD`.
 */
export const StaffDatePickerField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  errorMessage,
  helperText,
}: StaffDatePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              'w-full p-2 justify-between font-normal',
              !selectedDate && 'text-text-secondary'
            )}
          >
            {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: vi }) : placeholder}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            defaultMonth={selectedDate}
            locale={vi}
            onSelect={(nextDate) => {
              if (!nextDate) {
                return;
              }

              onChange(format(nextDate, 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
      {!errorMessage && helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
    </div>
  );
};
