import { useQuery } from '@tanstack/react-query';

import { geoapifyService } from '@modules/branch/services/geoapifyService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useDebounce } from '@shared/hooks/useDebounce';

/**
 * Số ký tự tối thiểu trước khi gọi Geoapify để tránh spam request khi user mới bắt đầu gõ.
 */
const MIN_ADDRESS_AUTOCOMPLETE_LENGTH = 3;

/**
 * Delay debounce cho autocomplete địa chỉ để cân bằng tốc độ phản hồi và quota Geoapify.
 */
const ADDRESS_AUTOCOMPLETE_DEBOUNCE_MS = 350;

/**
 * Thời gian cache gợi ý địa chỉ ngắn vì dữ liệu chỉ phục vụ thao tác nhập form hiện tại.
 */
const ADDRESS_AUTOCOMPLETE_STALE_TIME = 5 * 60 * 1000;

/**
 * Hook lấy gợi ý địa chỉ Geoapify theo text user nhập ở form chi nhánh.
 *
 * @param text - địa chỉ user đang nhập
 */
export const useGeoapifyAddressAutocomplete = (text: string) => {
  const debouncedText = useDebounce(text.trim(), ADDRESS_AUTOCOMPLETE_DEBOUNCE_MS);

  return useQuery({
    queryKey: queryKeys.branches.addressAutocomplete(debouncedText),
    queryFn: () => geoapifyService.autocompleteAddress(debouncedText),
    enabled: debouncedText.length >= MIN_ADDRESS_AUTOCOMPLETE_LENGTH,
    staleTime: ADDRESS_AUTOCOMPLETE_STALE_TIME,
  });
};
