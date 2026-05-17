import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';

interface OrderQuantityInputProps {
  value: number;
  disabled?: boolean;
  min?: number;
  inputClassName?: string;
  decreaseButtonClassName?: string;
  increaseButtonClassName?: string;
  containerClassName?: string;
  onCommit: (quantity: number) => void;
}

const sanitizeQuantityInput = (value: string) => value.replace(/\D/g, '');

/**
 * Control số lượng món trong order.
 * Cho phép nhập nhanh số lớn, nhưng chỉ cập nhật khi blur, Enter hoặc bấm tăng/giảm.
 */
export const OrderQuantityInput = ({
  value,
  disabled = false,
  min = 1,
  inputClassName,
  decreaseButtonClassName,
  increaseButtonClassName,
  containerClassName,
  onCommit,
}: OrderQuantityInputProps) => {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const getValidDraftQuantity = () => {
    const parsedQuantity = Number(draftValue);

    if (
      draftValue.trim().length === 0 ||
      !Number.isSafeInteger(parsedQuantity) ||
      parsedQuantity < min
    ) {
      return null;
    }

    return parsedQuantity;
  };

  const commitQuantity = (quantity: number) => {
    setDraftValue(String(quantity));

    if (quantity !== value) {
      onCommit(quantity);
    }
  };

  const commitDraftValue = () => {
    const parsedQuantity = getValidDraftQuantity();

    if (parsedQuantity === null) {
      setDraftValue(String(value));
      return;
    }

    commitQuantity(parsedQuantity);
  };

  const handleStepQuantity = (delta: number) => {
    const baseQuantity = getValidDraftQuantity() ?? value;
    const nextQuantity = baseQuantity + delta;

    if (nextQuantity < min) {
      setDraftValue(String(value));
      onCommit(nextQuantity);
      return;
    }

    commitQuantity(nextQuantity);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-[#eadbce] bg-[#fcf7f2] px-2 py-1.5',
        containerClassName
      )}
    >
      <button
        type="button"
        onClick={() => handleStepQuantity(-1)}
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#f3e8df] hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50',
          decreaseButtonClassName
        )}
        aria-label="Giảm số lượng món"
      >
        <Minus className="h-4 w-4" />
      </button>

      <Input
        value={draftValue}
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Số lượng món"
        className={cn(
          'h-8 w-14 rounded-full px-2 text-center text-[1rem] font-black text-slate-900',
          ' focus-visible:ring-offset-0 border-0',
          inputClassName
        )}
        onChange={(event) => setDraftValue(sanitizeQuantityInput(event.target.value))}
        onBlur={commitDraftValue}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />

      <button
        type="button"
        onClick={() => handleStepQuantity(1)}
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#f3e8df] hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50',
          increaseButtonClassName
        )}
        aria-label="Tăng số lượng món"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};
