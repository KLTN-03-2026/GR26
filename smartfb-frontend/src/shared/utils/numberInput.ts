/**
 * Các hàm chuẩn hóa input số cho form.
 * UI hiển thị phân tách hàng nghìn theo chuẩn vi-VN, payload vẫn giữ number sạch.
 */

// Dấu phân tách hàng nghìn giúp thu ngân/owner đọc nhanh số tiền lớn.
const THOUSAND_SEPARATOR = '.';

// Dấu thập phân hiển thị theo chuẩn Việt Nam.
const DECIMAL_SEPARATOR = ',';

/**
 * Chỉ giữ lại chữ số cho input số nguyên/tiền.
 *
 * @param value - Chuỗi người dùng nhập
 */
export const sanitizeIntegerInputValue = (value: string): string => value.replace(/\D/g, '');

/**
 * Chỉ giữ số và một dấu thập phân cho input số lẻ.
 *
 * @param value - Chuỗi người dùng nhập
 */
export const sanitizeDecimalInputValue = (value: string): string => {
  const normalized = value.replace(/\s/g, '').replace(/,/g, '.');
  let result = '';
  let hasDecimalSeparator = false;

  for (const char of normalized) {
    if (/\d/.test(char)) {
      result += char;
      continue;
    }

    if (char === '.' && !hasDecimalSeparator) {
      result += result === '' ? '0.' : '.';
      hasDecimalSeparator = true;
    }
  }

  return result;
};

/**
 * Chuẩn hóa chuỗi input theo kiểu số cần nhập.
 *
 * @param value - Chuỗi người dùng nhập
 * @param allowDecimal - Có cho phép phần thập phân hay không
 */
export const sanitizeNumericInputValue = (value: string, allowDecimal = false): string =>
  allowDecimal ? sanitizeDecimalInputValue(value) : sanitizeIntegerInputValue(value);

const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '');

const formatIntegerDigits = (digits: string): string => {
  const normalizedDigits = trimLeadingZeros(digits);

  if (!normalizedDigits) {
    return '';
  }

  return normalizedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEPARATOR);
};

/**
 * Format chuỗi số để hiển thị trong input.
 *
 * @param value - Giá trị đã nhập hoặc giá trị number hiện tại
 * @param allowDecimal - Có cho phép phần thập phân hay không
 */
export const formatNumericInputValue = (
  value: string | number | null | undefined,
  allowDecimal = false,
): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const rawValue = String(value);

  if (!allowDecimal) {
    return formatIntegerDigits(sanitizeIntegerInputValue(rawValue));
  }

  const sanitizedValue = sanitizeDecimalInputValue(rawValue);

  if (!sanitizedValue) {
    return '';
  }

  const hasDecimalPart = sanitizedValue.includes('.');
  const [integerPart = '', decimalPart = ''] = sanitizedValue.split('.');
  const formattedInteger = formatIntegerDigits(integerPart) || '0';

  return hasDecimalPart
    ? `${formattedInteger}${DECIMAL_SEPARATOR}${decimalPart}`
    : formattedInteger;
};

/**
 * Parse chuỗi số đã format về number để gửi API hoặc tính toán.
 *
 * @param value - Chuỗi input có thể chứa dấu phân tách hàng nghìn
 * @param allowDecimal - Có cho phép phần thập phân hay không
 */
export const parseNumericInputValue = (value: string, allowDecimal = false): number | null => {
  const sanitizedValue = sanitizeNumericInputValue(value, allowDecimal);

  if (!sanitizedValue) {
    return null;
  }

  const parsedValue = Number(sanitizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};
