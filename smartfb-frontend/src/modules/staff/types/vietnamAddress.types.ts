/**
 * Đơn vị tỉnh/thành từ Provinces Open API v2 sau sáp nhập hành chính 07/2025.
 */
export interface VietnamProvince {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  wards: VietnamWard[];
}

/**
 * Đơn vị phường/xã trực thuộc tỉnh/thành trong mô hình địa giới 2 cấp.
 */
export interface VietnamWard {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
}
