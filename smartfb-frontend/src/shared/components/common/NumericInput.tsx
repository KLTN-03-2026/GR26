import { forwardRef, useEffect, useState, type ChangeEvent, type FocusEvent } from 'react';
import { Input, type InputProps } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';

interface NumericInputProps
  extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange' | 'inputMode'> {
  value?: number | null;
  onValueChange: (value: number) => void;
  emptyValue?: number;
  allowDecimal?: boolean;
  hideZeroValue?: boolean;
}

/**
 * Chuẩn hóa giá trị số sang chuỗi hiển thị cho input.
 */
const formatDisplayValue = (value: number | null | undefined, hideZeroValue: boolean): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (hideZeroValue && value === 0) {
    return '';
  }

  return String(value);
};

/**
 * Parse chuỗi người dùng nhập thành number hợp lệ.
 */
const parseNumericValue = (rawValue: string, allowDecimal: boolean): number | null => {
  if (!rawValue.trim()) {
    return null;
  }

  const parsedValue = allowDecimal ? Number(rawValue) : Number.parseInt(rawValue, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

/**
 * Input số dùng chung để tránh tình trạng dính `0` khi nhập và ẩn spinner mặc định của browser.
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      emptyValue = 0,
      allowDecimal = false,
      hideZeroValue = false,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>(
      formatDisplayValue(value, hideZeroValue)
    );

    useEffect(() => {
      setDisplayValue(formatDisplayValue(value, hideZeroValue));
    }, [hideZeroValue, value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const nextDisplayValue = event.target.value;
      const parsedValue = parseNumericValue(nextDisplayValue, allowDecimal);

      setDisplayValue(nextDisplayValue);

      if (parsedValue === null) {
        return;
      }

      onValueChange(parsedValue);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      const parsedValue = parseNumericValue(event.target.value, allowDecimal);

      if (parsedValue === null) {
        const fallbackValue = value ?? emptyValue;
        const normalizedValue = event.target.value.trim() === '' ? emptyValue : fallbackValue;

        setDisplayValue(formatDisplayValue(normalizedValue, hideZeroValue));
        onValueChange(normalizedValue);
        onBlur?.(event);
        return;
      }

      setDisplayValue(formatDisplayValue(parsedValue, hideZeroValue));
      onValueChange(parsedValue);
      onBlur?.(event);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className
        )}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';
