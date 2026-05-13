import axios from 'axios';

import type { VietnamProvince } from '@modules/staff/types/vietnamAddress.types';

// API địa giới hành chính Việt Nam v2 dùng để chuẩn hóa địa chỉ nhân viên.
const PROVINCES_API_BASE_URL =
  import.meta.env.VITE_PROVINCES_API_BASE_URL || 'https://provinces.open-api.vn/api/v2';

// Timeout ngắn để form tạo nhân viên không bị kẹt lâu khi API công khai chậm.
const PROVINCES_API_TIMEOUT = 10000;

const provincesApi = axios.create({
  baseURL: PROVINCES_API_BASE_URL,
  timeout: PROVINCES_API_TIMEOUT,
});

export const vietnamAddressService = {
  /**
   * Lấy danh sách tỉnh/thành, chưa load phường để tránh gọi payload lớn không cần thiết.
   */
  getProvinces: () =>
    provincesApi.get<VietnamProvince[]>('/').then((response) => response.data),

  /**
   * Lấy chi tiết tỉnh/thành kèm danh sách phường/xã theo mã tỉnh.
   */
  getProvinceByCode: (provinceCode: number) =>
    provincesApi
      .get<VietnamProvince>(`/p/${provinceCode}`, { params: { depth: 2 } })
      .then((response) => response.data),
};
