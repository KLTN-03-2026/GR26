import { useRef } from 'react';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  inputIdPrefix?: string;
}

const getDigitsOnly = (value: string): string => value.replace(/\D/g, '');

const updateOtpValue = (
  currentValue: string,
  startIndex: number,
  incomingValue: string,
  length: number
): string => {
  const nextCharacters = Array.from({ length }, (_, index) => currentValue[index] ?? '');
  const digits = getDigitsOnly(incomingValue);

  if (!digits) {
    nextCharacters[startIndex] = '';
    return nextCharacters.join('');
  }

  digits.split('').forEach((digit, offset) => {
    const nextIndex = startIndex + offset;

    if (nextIndex < length) {
      nextCharacters[nextIndex] = digit;
    }
  });

  return nextCharacters.join('');
};

/**
 * Hiển thị OTP dưới dạng nhiều ô vuông để người dùng nhập từng chữ số rõ ràng hơn.
 */
export const OtpCodeInput = ({
  value,
  onChange,
  onBlur,
  length = 6,
  disabled = false,
  hasError = false,
  inputIdPrefix = 'otp-digit',
}: OtpCodeInputProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  const focusInput = (index: number) => {
    const inputElement = inputRefs.current[index];

    if (!inputElement) {
      return;
    }

    inputElement.focus();
    inputElement.select();
  };

  const handleInputChange = (index: number, rawValue: string) => {
    const digitsOnly = getDigitsOnly(rawValue);

    if (!digitsOnly) {
      onChange(updateOtpValue(value, index, '', length));
      return;
    }

    onChange(updateOtpValue(value, index, digitsOnly, length));

    const nextIndex = Math.min(index + digitsOnly.length, length - 1);
    requestAnimationFrame(() => focusInput(nextIndex));
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();

      if (digits[index]) {
        onChange(updateOtpValue(value, index, '', length));
        return;
      }

      if (index > 0) {
        const previousIndex = index - 1;
        onChange(updateOtpValue(value, previousIndex, '', length));
        requestAnimationFrame(() => focusInput(previousIndex));
      }

      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
      return;
    }

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    // Cho phép dán cả chuỗi OTP để hệ thống tự rải vào từng ô.
    const pastedDigits = getDigitsOnly(event.clipboardData.getData('text'));

    if (!pastedDigits) {
      return;
    }

    onChange(updateOtpValue(value, index, pastedDigits, length));

    const nextIndex = Math.min(index + pastedDigits.length, length - 1);
    requestAnimationFrame(() => focusInput(nextIndex));
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (nextFocusedElement instanceof Node && containerRef.current?.contains(nextFocusedElement)) {
      return;
    }

    onBlur?.();
  };

  return (
    <div ref={containerRef} className="grid grid-cols-6 gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <Input
          key={index}
          id={`${inputIdPrefix}-${index}`}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Chữ số OTP thứ ${index + 1}`}
          className={cn(
            'h-14  rounded-card border border-border bg-primary-light px-0 text-center text-lg font-semibold text-text-primary shadow-card transition-all duration-200 focus:border-primary focus:bg-card',
            hasError && 'border-red-500 focus:border-red-500'
          )}
          onChange={(event) => handleInputChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          onBlur={handleBlur}
        />
      ))}
    </div>
  );
};
