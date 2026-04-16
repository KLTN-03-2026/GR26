import { forwardRef, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { cn } from '@shared/utils/cn';

export interface SearchableComboboxOption {
  value: string;
  label: string;
  description?: string;
  keywords?: Array<string | undefined | null>;
  disabled?: boolean;
}

export interface SearchableComboboxProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  value: string;
  options: SearchableComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  allowCustomValue?: boolean;
  contentClassName?: string;
  onValueChange: (value: string) => void;
}

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();

/**
 * Combobox dùng chung cho các field cần vừa gõ để lọc, vừa chọn nhanh từ danh sách.
 * Giữ giao diện trigger quen thuộc nhưng thêm ô tìm kiếm trong popup theo pattern shadcn.
 */
export const SearchableCombobox = forwardRef<HTMLButtonElement, SearchableComboboxProps>(
  (
    {
      value,
      options,
      placeholder,
      searchPlaceholder,
      emptyMessage,
      allowCustomValue = false,
      disabled = false,
      className,
      contentClassName,
      onValueChange,
      ...buttonProps
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    const selectedOption = useMemo(
      () => options.find((option) => option.value === value) ?? null,
      [options, value],
    );

    const normalizedSearch = useMemo(() => normalizeSearchText(searchValue), [searchValue]);

    const filteredOptions = useMemo(() => {
      if (!normalizedSearch) {
        return options;
      }

      return options.filter((option) => {
        const searchTargets = [option.label, option.description, ...(option.keywords ?? [])]
          .filter(Boolean)
          .join(' ');

        return normalizeSearchText(searchTargets).includes(normalizedSearch);
      });
    }, [normalizedSearch, options]);

    const canUseCustomValue =
      allowCustomValue &&
      searchValue.trim().length > 0 &&
      !options.some((option) => normalizeSearchText(option.value) === normalizedSearch) &&
      !options.some((option) => normalizeSearchText(option.label) === normalizedSearch);

    const triggerLabel = selectedOption?.label ?? (allowCustomValue && value.trim() ? value : placeholder);

    useEffect(() => {
      if (!open) {
        return;
      }

      // Delay 1 frame để popover mount xong rồi mới focus vào ô tìm kiếm.
      const frameId = window.requestAnimationFrame(() => {
        inputRef.current?.focus();
        if (allowCustomValue && inputRef.current?.value) {
          inputRef.current.select();
        }
      });

      return () => window.cancelAnimationFrame(frameId);
    }, [allowCustomValue, open]);

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        setSearchValue(allowCustomValue ? selectedOption?.label ?? value : '');
        return;
      }

      setSearchValue('');
    };

    const handleSelectValue = (nextValue: string) => {
      onValueChange(nextValue);
      setOpen(false);
      setSearchValue('');
    };

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            {...buttonProps}
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn('w-full justify-between font-normal', className)}
          >
            <span className={cn('truncate', !selectedOption && !value && 'text-text-secondary')}>
              {triggerLabel}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn('w-[var(--radix-popover-trigger-width)] p-0', contentClassName)}
        >
          <div className="border-b border-border px-3 py-2">
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canUseCustomValue) {
                  event.preventDefault();
                  handleSelectValue(searchValue.trim());
                }
              }}
              placeholder={searchPlaceholder}
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length === 0 && !canUseCustomValue ? (
              <p className="px-3 py-3 text-sm text-text-secondary">{emptyMessage}</p>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-muted focus:bg-muted focus:outline-none',
                    )}
                    onClick={() => {
                      if (option.disabled) {
                        return;
                      }

                      handleSelectValue(option.value);
                    }}
                    disabled={option.disabled}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">{option.label}</span>
                      {option.description ? (
                        <span className="block truncate text-xs text-text-secondary">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        option.value === value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </button>
                ))}

                {canUseCustomValue ? (
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                    onClick={() => handleSelectValue(searchValue.trim())}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">
                        Dùng &quot;{searchValue.trim()}&quot;
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        Tạo nhanh giá trị mới cho field đang nhập.
                      </span>
                    </span>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-0" />
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

SearchableCombobox.displayName = 'SearchableCombobox';
