import { useQuery } from '@tanstack/react-query';

import { vietnamAddressService } from '@modules/staff/services/vietnamAddressService';
import { queryKeys } from '@shared/constants/queryKeys';

// Danh mục địa giới ít đổi trong ngày, cache 24h để giảm tải API công khai.
const VIETNAM_ADDRESS_STALE_TIME = 24 * 60 * 60 * 1000;

/**
 * Hook lấy danh sách tỉnh/thành Việt Nam từ Provinces Open API v2.
 */
export const useVietnamProvinces = () =>
  useQuery({
    queryKey: queryKeys.vietnamAddress.provinces(),
    queryFn: vietnamAddressService.getProvinces,
    staleTime: VIETNAM_ADDRESS_STALE_TIME,
  });

/**
 * Hook lấy danh sách phường/xã theo mã tỉnh/thành đã chọn.
 *
 * @param provinceCode - Mã tỉnh/thành từ Provinces Open API v2
 */
export const useVietnamWards = (provinceCode: number | null) =>
  useQuery({
    queryKey: queryKeys.vietnamAddress.wards(provinceCode),
    queryFn: async () => {
      if (provinceCode === null) {
        return [];
      }

      const province = await vietnamAddressService.getProvinceByCode(provinceCode);
      return province.wards ?? [];
    },
    enabled: provinceCode !== null,
    staleTime: VIETNAM_ADDRESS_STALE_TIME,
  });
