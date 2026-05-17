import axios from 'axios';

import type {
  BranchAddressSuggestion,
  GeoapifyAutocompleteFeature,
  GeoapifyAutocompleteResponse,
} from '@modules/branch/types/branch.types';

/**
 * Base URL Geoapify Geocode API dùng cho autocomplete địa chỉ chi nhánh.
 */
const GEOAPIFY_API_BASE_URL =
  import.meta.env.VITE_GEOAPIFY_API_BASE_URL || 'https://api.geoapify.com/v1/geocode';

/**
 * API key Geoapify dùng cho autocomplete địa chỉ chi nhánh.
 * Có thể override bằng `VITE_GEOAPIFY_API_KEY` khi deploy.
 */
const GEOAPIFY_API_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY || '290f2442d9ab4322b71caf28815024d7';

/**
 * Số gợi ý tối đa hiển thị để dropdown gọn và giảm nhiễu khi user nhập địa chỉ.
 */
const GEOAPIFY_AUTOCOMPLETE_LIMIT = 5;

/**
 * Timeout ngắn để form chi nhánh không bị kẹt lâu khi API bản đồ phản hồi chậm.
 */
const GEOAPIFY_API_TIMEOUT = 10000;

const geoapifyApi = axios.create({
  baseURL: GEOAPIFY_API_BASE_URL,
  timeout: GEOAPIFY_API_TIMEOUT,
});

const resolveCoordinate = (
  feature: GeoapifyAutocompleteFeature,
  coordinateIndex: number,
  propertyValue?: number,
): number | null => {
  if (typeof propertyValue === 'number') {
    return propertyValue;
  }

  const coordinateValue = feature.geometry.coordinates[coordinateIndex];
  return typeof coordinateValue === 'number' ? coordinateValue : null;
};

const toBranchAddressSuggestion = (
  feature: GeoapifyAutocompleteFeature,
): BranchAddressSuggestion | null => {
  const longitude = resolveCoordinate(feature, 0, feature.properties.lon);
  const latitude = resolveCoordinate(feature, 1, feature.properties.lat);
  const formatted = feature.properties.formatted?.trim();

  if (!formatted || latitude === null || longitude === null) {
    return null;
  }

  return {
    id: feature.properties.place_id ?? `${formatted}-${latitude}-${longitude}`,
    formatted,
    addressLine1: feature.properties.address_line1 ?? formatted,
    addressLine2: feature.properties.address_line2 ?? '',
    latitude,
    longitude,
    city: feature.properties.city,
    state: feature.properties.state,
    postcode: feature.properties.postcode,
  };
};

export const geoapifyService = {
  /**
   * Lấy danh sách gợi ý địa chỉ Việt Nam từ Geoapify autocomplete.
   *
   * @param text - địa chỉ user đang nhập
   */
  autocompleteAddress: (text: string): Promise<BranchAddressSuggestion[]> =>
    geoapifyApi
      .get<GeoapifyAutocompleteResponse>('/autocomplete', {
        params: {
          text,
          apiKey: GEOAPIFY_API_KEY,
          filter: 'countrycode:vn',
          lang: 'vi',
          bias: 'proximity:108.2022,16.0544',

          // chỉ lấy địa chỉ thật
          type: 'street',
          limit: GEOAPIFY_AUTOCOMPLETE_LIMIT,
        },
      })
      .then((response) =>
        response.data.features
          .map(toBranchAddressSuggestion)
          .filter((suggestion): suggestion is BranchAddressSuggestion => suggestion !== null),
      ),
};
