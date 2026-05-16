import { AlertCircle, CheckCircle2, LoaderCircle, MapPin } from 'lucide-react';
import { useState } from 'react';

import { useGeoapifyAddressAutocomplete } from '@modules/branch/hooks/useGeoapifyAddressAutocomplete';
import type { BranchAddressSuggestion, CreateBranchFormData } from '@modules/branch/types/branch.types';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/utils/cn';

type BranchAddressValue = Pick<CreateBranchFormData, 'address' | 'latitude' | 'longitude'>;

interface BranchAddressAutocompleteProps {
  id: string;
  value: BranchAddressValue;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange: (data: BranchAddressValue) => void;
}

const formatCoordinate = (value: number) => value.toFixed(6);

/**
 * Ô nhập địa chỉ chi nhánh có autocomplete Geoapify và lưu kèm tọa độ backend cần.
 */
export const BranchAddressAutocomplete = ({
  id,
  value,
  placeholder = '374 Tôn Đản, Phường 4, Quận 4, TP. Hồ Chí Minh',
  error,
  disabled = false,
  className,
  onChange,
}: BranchAddressAutocompleteProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const {
    data: suggestions = [],
    isFetching,
    isError,
  } = useGeoapifyAddressAutocomplete(value.address);

  const selectedLatitude = value.latitude;
  const selectedLongitude = value.longitude;
  const hasCoordinates = selectedLatitude !== null && selectedLongitude !== null;
  const canShowDropdown = isFocused && value.address.trim().length >= 3 && !disabled;

  const handleAddressChange = (address: string) => {
    onChange({
      address,
      latitude: null,
      longitude: null,
    });
  };

  const handleSelectSuggestion = (suggestion: BranchAddressSuggestion) => {
    onChange({
      address: suggestion.formatted,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setIsFocused(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Textarea
          id={id}
          value={value.address}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay ngắn để click vào gợi ý được xử lý trước khi dropdown đóng.
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          onChange={(event) => handleAddressChange(event.target.value)}
          className={cn(
            'min-h-[96px] pr-10 focus-visible:border-orange-500 focus-visible:ring-orange-500',
            error && 'border-red-500 focus-visible:ring-red-500',
          )}
        />
        <MapPin className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />

        {canShowDropdown ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
            {isFetching ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-text-secondary">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Đang tìm địa chỉ...
              </div>
            ) : null}

            {isError ? (
              <div className="flex items-start gap-2 px-3 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Không tải được gợi ý địa chỉ. Vui lòng thử lại.
              </div>
            ) : null}

            {!isFetching && !isError && suggestions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-text-secondary">Không tìm thấy địa chỉ phù hợp.</p>
            ) : null}

            {!isError && suggestions.length > 0 ? (
              <div className="max-h-72 overflow-y-auto p-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {suggestion.addressLine1}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        {suggestion.addressLine2 || suggestion.formatted}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasCoordinates ? (
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            Đã chọn tọa độ: {formatCoordinate(selectedLatitude)}, {formatCoordinate(selectedLongitude)}
          </span>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Chọn một gợi ý để lưu tọa độ GPS cho chi nhánh.</p>
      )}
    </div>
  );
};
