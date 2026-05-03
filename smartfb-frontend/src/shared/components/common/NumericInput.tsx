import { forwardRef, useEffect, useState, type ChangeEvent, type FocusEvent } from 'react';
import { Input, type InputProps } from '@shared/components/ui/input';
import {
  formatNumericInputValue,
  parseNumericInputValue,
  sanitizeNumericInputValue,
} from '@shared/utils/numberInput';

interface NumericInputProps
  extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange' | 'inputMode'> {
  value?: number | null;
  onValueChange: (value: number) => void;
  emptyValue?: number;
  allowDecimal?: boolean;
  formatThousands?: boolean;
  hideZeroValue?: boolean;
}

/**
 * Chuẩn hóa giá trị số sang chuỗi hiển thị cho input.
 */
const formatDisplayValue = (
  value: number | null | undefined,
  hideZeroValue: boolean,
  allowDecimal: boolean,
  formatThousands: boolean,
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (hideZeroValue && value === 0) {
    return '';
  }

  return formatThousands ? formatNumericInputValue(value, allowDecimal) : String(value);
};

/**
 * Parse chuỗi người dùng nhập thành number hợp lệ.
 */
const parseNumericValue = (rawValue: string, allowDecimal: boolean): number | null => {
  return parseNumericInputValue(rawValue, allowDecimal);
};

/**
 * Input số dùng chung để tránh tình trạng dính `0` khi nhập và ẩn spinner mặc định của browser.
 * Với số nguyên, input tự thêm dấu phân tách hàng nghìn để dễ đọc số tiền/số lượng lớn.
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      emptyValue = 0,
      allowDecimal = false,
      formatThousands = !allowDecimal,
      hideZeroValue = false,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>(
      formatDisplayValue(value, hideZeroValue, allowDecimal, formatThousands)
    );

    useEffect(() => {
      setDisplayValue(formatDisplayValue(value, hideZeroValue, allowDecimal, formatThousands));
    }, [allowDecimal, formatThousands, hideZeroValue, value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;

      // Chỉ giữ lại ký tự số hợp lệ, phần format chỉ phục vụ hiển thị.
      const sanitized = sanitizeNumericInputValue(raw, allowDecimal);
      const parsedValue = parseNumericValue(sanitized, allowDecimal);

      setDisplayValue(formatThousands ? formatNumericInputValue(sanitized, allowDecimal) : sanitized);

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

        setDisplayValue(formatDisplayValue(normalizedValue, hideZeroValue, allowDecimal, formatThousands));
        onValueChange(normalizedValue);
        onBlur?.(event);
        return;
      }

      setDisplayValue(formatDisplayValue(parsedValue, hideZeroValue, allowDecimal, formatThousands));
      onValueChange(parsedValue);
      onBlur?.(event);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';
