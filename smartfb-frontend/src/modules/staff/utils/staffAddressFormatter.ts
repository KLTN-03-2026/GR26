interface StaffAddressParts {
  streetAddress?: string;
  wardDistrict?: string;
  city?: string;
}

/**
 * Ghép 3 ô địa chỉ của UI thành 1 chuỗi address đúng contract backend.
 */
export const buildStaffAddress = ({
  streetAddress,
  wardDistrict,
  city,
}: StaffAddressParts): string => {
  return [streetAddress, wardDistrict, city]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(', ');
};

/**
 * Tách chuỗi địa chỉ hiện có để đổ lại vào 3 ô input.
 */
export const parseStaffAddress = (address?: string | null): Required<StaffAddressParts> => {
  if (!address?.trim()) {
    return {
      streetAddress: '',
      wardDistrict: '',
      city: '',
    };
  }

  const parts = address
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    streetAddress: parts[0] ?? '',
    wardDistrict: parts[1] ?? '',
    city: parts.slice(2).join(', '),
  };
};
